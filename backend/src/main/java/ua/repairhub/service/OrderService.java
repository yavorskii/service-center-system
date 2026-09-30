package ua.repairhub.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.repairhub.dto.request.AddPartToOrderRequest;
import ua.repairhub.dto.request.CreateOrderRequest;
import ua.repairhub.dto.request.UpdateDiagnosticsRequest;
import ua.repairhub.dto.response.OrderResponse;
import ua.repairhub.exception.InsufficientStockException;
import ua.repairhub.exception.ResourceNotFoundException;
import ua.repairhub.model.*;
import ua.repairhub.repository.*;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
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
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders(String search, OrderStatus status) {
        return orderRepository.searchOrders(search, status).stream()
                .map(DtoMapper::toOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з ID " + id + " не знайдено"));
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByTrackingCode(String trackingCode) {
        Order order = orderRepository.findByTrackingCode(trackingCode)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з трек-кодом '" + trackingCode + "' не знайдено"));
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        // 1. Отримати або створити клієнта
        Client client = clientRepository.findByPhone(request.getClientPhone())
                .orElseGet(() -> {
                    Client newClient = Client.builder()
                            .fullName(request.getClientName())
                            .phone(request.getClientPhone())
                            .email(request.getClientEmail())
                            .address(request.getClientAddress())
                            .build();
                    return clientRepository.save(newClient);
                });

        // 2. Створити та прив'язати пристрій
        Device device = Device.builder()
                .client(client)
                .deviceType(request.getDeviceType())
                .brand(request.getBrand())
                .model(request.getModel())
                .serialNumber(request.getSerialNumber())
                .appearanceNotes(request.getAppearanceNotes())
                .build();
        device = deviceRepository.save(device);

        // 3. Згенерувати унікальний номер замовлення та трек-код
        String orderNumber = generateNextOrderNumber();
        String trackingCode = generateUniqueTrackingCode();

        // 4. Створити замовлення
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .trackingCode(trackingCode)
                .client(client)
                .device(device)
                .status(OrderStatus.NEW)
                .priority(request.getPriority() != null ? request.getPriority() : OrderPriority.MEDIUM)
                .defectDescription(request.getDefectDescription())
                .estimatedCost(request.getEstimatedCost() != null ? request.getEstimatedCost() : BigDecimal.ZERO)
                .totalCost(request.getEstimatedCost() != null ? request.getEstimatedCost() : BigDecimal.ZERO)
                .build();

        order = orderRepository.save(order);
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з ID " + id + " не знайдено"));

        order.setStatus(newStatus);
        if (newStatus == OrderStatus.COMPLETED) {
            order.setCompletedAt(ZonedDateTime.now());
        }

        order = orderRepository.save(order);
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse updateDiagnostics(Long id, UpdateDiagnosticsRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з ID " + id + " не знайдено"));

        order.setDiagnosticsNotes(request.getDiagnosticsNotes());

        if (request.getTechnicianId() != null) {
            User tech = userRepository.findById(request.getTechnicianId())
                    .orElseThrow(() -> new ResourceNotFoundException("Майстра з ID " + request.getTechnicianId() + " не знайдено"));
            order.setTechnician(tech);
        }

        if (order.getStatus() == OrderStatus.NEW || order.getStatus() == OrderStatus.IN_DIAGNOSTICS) {
            order.setStatus(OrderStatus.IN_PROGRESS);
        }

        order = orderRepository.save(order);
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional
    public OrderResponse addPartToOrder(Long orderId, AddPartToOrderRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Замовлення з ID " + orderId + " не знайдено"));

        SparePart sparePart = sparePartRepository.findById(request.getSparePartId())
                .orElseThrow(() -> new ResourceNotFoundException("Деталь з ID " + request.getSparePartId() + " не знайдено"));

        // Перевірка наявності необхідної кількості деталей на складі
        if (sparePart.getStockQuantity() < request.getQuantity()) {
            throw new InsufficientStockException("Недостатньо деталей на складі для " + sparePart.getName() +
                    ": доступно " + sparePart.getStockQuantity() + " шт., запитано " + request.getQuantity() + " шт.");
        }

        // Автоматичне списання зі складу
        sparePart.setStockQuantity(sparePart.getStockQuantity() - request.getQuantity());
        sparePartRepository.save(sparePart);

        // Прикріплення деталі до замовлення
        OrderPart orderPart = OrderPart.builder()
                .order(order)
                .sparePart(sparePart)
                .quantity(request.getQuantity())
                .unitPrice(sparePart.getRetailPrice())
                .build();
        orderPartRepository.save(orderPart);

        // Перерахунок загальної вартості замовлення
        recalculateOrderTotalCost(order);

        order = orderRepository.save(order);
        return DtoMapper.toOrderResponse(order);
    }

    @Transactional
    public void deleteOrder(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new ResourceNotFoundException("Замовлення з ID " + id + " не знайдено");
        }
        orderRepository.deleteById(id);
    }

    private void recalculateOrderTotalCost(Order order) {
        BigDecimal partsSum = order.getOrderParts().stream()
                .map(op -> op.getUnitPrice().multiply(BigDecimal.valueOf(op.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal servicesSum = order.getOrderServices().stream()
                .map(OrderServiceEntity::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grandTotal = partsSum.add(servicesSum);
        if (grandTotal.compareTo(BigDecimal.ZERO) > 0) {
            order.setTotalCost(grandTotal);
        }
    }

    private String generateNextOrderNumber() {
        long count = orderRepository.count() + 1;
        return String.format("SRV-2026-%04d", count);
    }

    private String generateUniqueTrackingCode() {
        return "TRK-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
