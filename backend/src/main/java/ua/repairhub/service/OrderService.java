package ua.repairhub.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.repairhub.dto.request.AddPartToOrderRequest;
import ua.repairhub.dto.request.AddServiceToOrderRequest;
import ua.repairhub.dto.request.CreateOrderRequest;
import ua.repairhub.dto.request.UpdateDiagnosticsRequest;
import ua.repairhub.dto.response.OrderResponse;
import ua.repairhub.exception.BadRequestException;
import ua.repairhub.exception.InsufficientStockException;
import ua.repairhub.exception.ResourceNotFoundException;
import ua.repairhub.model.*;
import ua.repairhub.repository.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ClientRepository clientRepository;
    private final DeviceRepository deviceRepository;
    private final SparePartRepository sparePartRepository;
    private final OrderPartRepository orderPartRepository;
    private final ServiceRepository serviceRepository;
    private final OrderServiceRepository orderServiceRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders(String search, OrderStatus status) {
        return orderRepository.searchOrders(search, status).stream()
                .map(DtoMapper::toOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersForUser(String search, OrderStatus status, String username) {
        List<Order> orders = orderRepository.searchOrders(search, status);
        if (username == null) {
            return orders.stream().map(DtoMapper::toOrderResponse).collect(Collectors.toList());
        }
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null && user.getRole() == Role.ROLE_USER) {
            return orders.stream()
                    .filter(o -> isOrderOwnedByUser(o, user))
                    .map(DtoMapper::toOrderResponse)
                    .collect(Collectors.toList());
        }
        return orders.stream().map(DtoMapper::toOrderResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з ID " + id + " не знайдено"));
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByIdForUser(Long id, String username) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з ID " + id + " не знайдено"));
        if (username != null) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null && user.getRole() == Role.ROLE_USER) {
                if (!isOrderOwnedByUser(order, user)) {
                    throw new AccessDeniedException("Ви маєте доступ лише до власних замовлень");
                }
            }
        }
        return DtoMapper.toOrderResponse(order);
    }

    private boolean isOrderOwnedByUser(Order order, User user) {
        if (order.getClient() == null) return false;
        if (user.getEmail() != null && !user.getEmail().isBlank()
                && order.getClient().getEmail() != null
                && user.getEmail().trim().equalsIgnoreCase(order.getClient().getEmail().trim())) {
            return true;
        }
        if (user.getPhone() != null && !user.getPhone().isBlank() && order.getClient().getPhone() != null) {
            String uPhone = user.getPhone().replaceAll("[^0-9]", "");
            String cPhone = order.getClient().getPhone().replaceAll("[^0-9]", "");
            return !uPhone.isEmpty() && uPhone.equals(cPhone);
        }
        return false;
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByTrackingCode(String trackingCode) {
        Order order = orderRepository.findByTrackingCode(trackingCode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з трек-кодом '" + trackingCode + "' не знайдено"));
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> publicSearchOrders(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return orderRepository.publicSearchOrders(query.trim()).stream()
                .map(DtoMapper::toOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse createOrderForUser(CreateOrderRequest request, String username) {
        if (username != null) {
            userRepository.findByUsername(username).ifPresent(user -> {
                if (user.getRole() == Role.ROLE_USER
                        && (request.getClientEmail() == null || request.getClientEmail().isBlank())
                        && user.getEmail() != null) {
                    request.setClientEmail(user.getEmail());
                }
            });
        }
        return createOrder(request);
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        Client client = clientRepository.findByPhone(request.getClientPhone().trim())
                .map(existing -> {
                    if ((existing.getEmail() == null || existing.getEmail().isBlank())
                            && request.getClientEmail() != null && !request.getClientEmail().isBlank()) {
                        existing.setEmail(request.getClientEmail().trim());
                        return clientRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    Client newClient = Client.builder()
                            .fullName(request.getClientName().trim())
                            .phone(request.getClientPhone().trim())
                            .email(request.getClientEmail())
                            .address(request.getClientAddress())
                            .build();
                    return clientRepository.save(newClient);
                });

        Device device = Device.builder()
                .client(client)
                .deviceType(request.getDeviceType())
                .brand(request.getBrand())
                .model(request.getModel())
                .serialNumber(request.getSerialNumber())
                .appearanceNotes(request.getAppearanceNotes())
                .build();
        device = deviceRepository.save(device);

        String orderNumber = generateNextOrderNumber();
        String trackingCode = generateUniqueTrackingCode();
        BigDecimal estimated = request.getEstimatedCost() != null ? request.getEstimatedCost() : BigDecimal.ZERO;

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .trackingCode(trackingCode)
                .client(client)
                .device(device)
                .status(OrderStatus.NEW)
                .priority(request.getPriority() != null ? request.getPriority() : OrderPriority.MEDIUM)
                .defectDescription(request.getDefectDescription())
                .estimatedCost(estimated)
                .totalCost(estimated)
                .build();

        order = orderRepository.save(order);
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з ID " + id + " не знайдено"));

        if (newStatus == OrderStatus.CANCELED && order.getStatus() != OrderStatus.CANCELED) {
            if (order.getStatus() == OrderStatus.COMPLETED) {
                throw new BadRequestException("Неможливо скасувати вже видане клієнту замовлення");
            }
            returnPartsToWarehouse(order);
            order.getOrderParts().clear();
            order.setTotalCost(BigDecimal.ZERO);
        }

        order.setStatus(newStatus);
        if (newStatus == OrderStatus.COMPLETED) {
            order.setCompletedAt(ZonedDateTime.now());
        }

        order = orderRepository.save(order);
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse updateDiagnostics(Long id, UpdateDiagnosticsRequest request) {
        return updateDiagnostics(id, request, null);
    }

    @Transactional
    public OrderResponse updateDiagnostics(Long id, UpdateDiagnosticsRequest request, String currentUsername) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з ID " + id + " не знайдено"));

        order.setDiagnosticsNotes(request.getDiagnosticsNotes());

        if (request.getEstimatedCost() != null) {
            order.setEstimatedCost(request.getEstimatedCost());
        }

        if (request.getTechnicianId() != null) {
            User tech = userRepository.findById(request.getTechnicianId())
                    .orElseThrow(() -> new ResourceNotFoundException("Майстра з ID " + request.getTechnicianId() + " не знайдено"));
            order.setTechnician(tech);
        } else {
            autoAssignTechnicianIfAbsent(order, currentUsername);
        }

        if (order.getStatus() == OrderStatus.NEW || order.getStatus() == OrderStatus.IN_DIAGNOSTICS) {
            order.setStatus(OrderStatus.IN_PROGRESS);
        }

        recalculateOrderTotalCost(order);
        order = orderRepository.save(order);
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse addPartToOrder(Long orderId, AddPartToOrderRequest request) {
        return addPartToOrder(orderId, request, null);
    }

    @Transactional
    public OrderResponse addPartToOrder(Long orderId, AddPartToOrderRequest request, String currentUsername) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з ID " + orderId + " не знайдено"));

        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CANCELED) {
            throw new BadRequestException("Неможливо списувати запчастини у закрите або скасоване замовлення");
        }

        SparePart sparePart = sparePartRepository.findById(request.getSparePartId())
                .orElseThrow(() -> new ResourceNotFoundException("Деталь з ID " + request.getSparePartId() + " не знайдено"));

        if (sparePart.getStockQuantity() < request.getQuantity()) {
            throw new InsufficientStockException("Недостатньо деталей на складі для \"" + sparePart.getName() +
                    "\": доступно " + sparePart.getStockQuantity() + " шт., запитано " + request.getQuantity() + " шт.");
        }

        sparePart.setStockQuantity(sparePart.getStockQuantity() - request.getQuantity());
        sparePartRepository.save(sparePart);

        Optional<OrderPart> existingPartOpt = order.getOrderParts().stream()
                .filter(op -> op.getSparePart() != null && sparePart.getId().equals(op.getSparePart().getId()))
                .findFirst();

        if (existingPartOpt.isPresent()) {
            OrderPart existingPart = existingPartOpt.get();
            existingPart.setQuantity(existingPart.getQuantity() + request.getQuantity());
            orderPartRepository.save(existingPart);
        } else {
            OrderPart orderPart = OrderPart.builder()
                    .order(order)
                    .sparePart(sparePart)
                    .quantity(request.getQuantity())
                    .unitPrice(sparePart.getRetailPrice())
                    .build();
            OrderPart savedPart = orderPartRepository.save(orderPart);
            order.getOrderParts().add(savedPart != null ? savedPart : orderPart);
        }

        autoAssignTechnicianIfAbsent(order, currentUsername);
        if (order.getStatus() == OrderStatus.NEW || order.getStatus() == OrderStatus.IN_DIAGNOSTICS) {
            order.setStatus(OrderStatus.IN_PROGRESS);
        }

        recalculateOrderTotalCost(order);
        order = orderRepository.save(order);
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse removePartFromOrder(Long orderId, Long orderPartId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з ID " + orderId + " не знайдено"));

        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new BadRequestException("Неможливо повернути запчастину з уже виданого замовлення");
        }

        OrderPart target = order.getOrderParts().stream()
                .filter(op -> orderPartId.equals(op.getId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Списану деталь з ID " + orderPartId + " не знайдено у замовленні"));

        SparePart sparePart = target.getSparePart();
        if (sparePart != null) {
            sparePart.setStockQuantity(sparePart.getStockQuantity() + target.getQuantity());
            sparePartRepository.save(sparePart);
        }

        order.getOrderParts().remove(target);
        orderPartRepository.delete(target);

        recalculateOrderTotalCost(order);
        order = orderRepository.save(order);
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse addServiceToOrder(Long orderId, AddServiceToOrderRequest request, String currentUsername) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з ID " + orderId + " не знайдено"));

        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CANCELED) {
            throw new BadRequestException("Неможливо додавати послуги у закрите або скасоване замовлення");
        }

        ServiceEntity serviceEntity;
        if (request.getServiceId() != null) {
            serviceEntity = serviceRepository.findById(request.getServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Послугу з ID " + request.getServiceId() + " не знайдено"));
        } else if (request.getCustomServiceName() != null && !request.getCustomServiceName().isBlank()) {
            String trimmedName = request.getCustomServiceName().trim();
            BigDecimal defaultPrice = request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO;
            serviceEntity = serviceRepository.findByNameIgnoreCase(trimmedName)
                    .orElseGet(() -> serviceRepository.save(ServiceEntity.builder()
                            .name(trimmedName)
                            .description("Додано під час виконання ремонту")
                            .standardPrice(defaultPrice)
                            .build()));
        } else {
            throw new BadRequestException("Оберіть послугу з прайсу або введіть назву виконаної роботи");
        }

        BigDecimal appliedPrice = request.getPrice() != null ? request.getPrice() : serviceEntity.getStandardPrice();
        User assignedTech = resolveTechnician(order, currentUsername);

        OrderServiceEntity orderServiceItem = OrderServiceEntity.builder()
                .order(order)
                .service(serviceEntity)
                .technician(assignedTech)
                .price(appliedPrice)
                .status("COMPLETED")
                .build();

        OrderServiceEntity savedItem = orderServiceRepository.save(orderServiceItem);
        order.getOrderServices().add(savedItem != null ? savedItem : orderServiceItem);

        if (order.getTechnician() == null && assignedTech != null) {
            order.setTechnician(assignedTech);
        }
        if (order.getStatus() == OrderStatus.NEW || order.getStatus() == OrderStatus.IN_DIAGNOSTICS) {
            order.setStatus(OrderStatus.IN_PROGRESS);
        }

        recalculateOrderTotalCost(order);
        order = orderRepository.save(order);
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse removeServiceFromOrder(Long orderId, Long orderServiceId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з ID " + orderId + " не знайдено"));

        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new BadRequestException("Неможливо видалити роботу з уже виданого замовлення");
        }

        OrderServiceEntity target = order.getOrderServices().stream()
                .filter(os -> orderServiceId.equals(os.getId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Послугу з ID " + orderServiceId + " не знайдено у замовленні"));

        order.getOrderServices().remove(target);
        orderServiceRepository.delete(target);

        recalculateOrderTotalCost(order);
        order = orderRepository.save(order);
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional
    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з ID " + id + " не знайдено"));

        if (order.getStatus() != OrderStatus.COMPLETED && order.getStatus() != OrderStatus.CANCELED) {
            returnPartsToWarehouse(order);
        }
        orderRepository.delete(order);
    }

    private void returnPartsToWarehouse(Order order) {
        for (OrderPart op : order.getOrderParts()) {
            SparePart sp = op.getSparePart();
            if (sp != null && op.getQuantity() != null && op.getQuantity() > 0) {
                sp.setStockQuantity(sp.getStockQuantity() + op.getQuantity());
                sparePartRepository.save(sp);
            }
        }
    }

    private void autoAssignTechnicianIfAbsent(Order order, String currentUsername) {
        if (order.getTechnician() != null || currentUsername == null || currentUsername.isBlank()) {
            return;
        }
        userRepository.findByUsername(currentUsername).ifPresent(user -> {
            if (user.getRole() == Role.ROLE_TECHNICIAN) {
                order.setTechnician(user);
            }
        });
    }

    private User resolveTechnician(Order order, String currentUsername) {
        if (currentUsername != null && !currentUsername.isBlank()) {
            Optional<User> current = userRepository.findByUsername(currentUsername);
            if (current.isPresent() && current.get().getRole() == Role.ROLE_TECHNICIAN) {
                return current.get();
            }
        }
        return order.getTechnician();
    }

    private void recalculateOrderTotalCost(Order order) {
        BigDecimal partsSum = order.getOrderParts().stream()
                .map(op -> op.getUnitPrice().multiply(BigDecimal.valueOf(op.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal servicesSum = order.getOrderServices().stream()
                .map(OrderServiceEntity::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (order.getOrderParts().isEmpty() && order.getOrderServices().isEmpty()) {
            order.setTotalCost(order.getEstimatedCost() != null ? order.getEstimatedCost() : BigDecimal.ZERO);
        } else {
            order.setTotalCost(partsSum.add(servicesSum));
        }
    }

    private String generateNextOrderNumber() {
        Optional<Order> latest = orderRepository.findTopByOrderByIdDesc();
        if (latest.isPresent()) {
            Order lastOrder = latest.get();
            long nextNum = (lastOrder.getId() != null ? lastOrder.getId() : orderRepository.count()) + 1;
            String lastNumStr = lastOrder.getOrderNumber();
            if (lastNumStr != null && lastNumStr.matches(".*-(\\d+)$")) {
                try {
                    long parsed = Long.parseLong(lastNumStr.substring(lastNumStr.lastIndexOf('-') + 1)) + 1;
                    nextNum = Math.max(nextNum, parsed);
                } catch (NumberFormatException ignored) {
                }
            }
            return String.format("SRV-2026-%04d", nextNum);
        }
        long count = orderRepository.count() + 1;
        return String.format("SRV-2026-%04d", count);
    }

    private String generateUniqueTrackingCode() {
        return "TRK-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
