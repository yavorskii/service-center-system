package ua.repairhub.service;

import ua.repairhub.dto.response.ClientResponse;
import ua.repairhub.dto.response.DeviceResponse;
import ua.repairhub.dto.response.OrderResponse;
import ua.repairhub.dto.response.SparePartResponse;
import ua.repairhub.model.*;

import java.math.BigDecimal;
import java.util.stream.Collectors;

public class DtoMapper {

    public static ClientResponse toClientResponse(Client client) {
        if (client == null) return null;
        return ClientResponse.builder()
                .id(client.getId())
                .fullName(client.getFullName())
                .phone(client.getPhone())
                .email(client.getEmail())
                .address(client.getAddress())
                .notes(client.getNotes())
                .createdAt(client.getCreatedAt())
                .build();
    }

    public static DeviceResponse toDeviceResponse(Device device) {
        if (device == null) return null;
        return DeviceResponse.builder()
                .id(device.getId())
                .clientId(device.getClient() != null ? device.getClient().getId() : null)
                .deviceType(device.getDeviceType())
                .brand(device.getBrand())
                .model(device.getModel())
                .serialNumber(device.getSerialNumber())
                .imei(device.getImei())
                .appearanceNotes(device.getAppearanceNotes())
                .createdAt(device.getCreatedAt())
                .build();
    }

    public static SparePartResponse toSparePartResponse(SparePart part) {
        if (part == null) return null;
        return SparePartResponse.builder()
                .id(part.getId())
                .sku(part.getSku())
                .name(part.getName())
                .category(part.getCategory())
                .purchasePrice(part.getPurchasePrice())
                .retailPrice(part.getRetailPrice())
                .stockQuantity(part.getStockQuantity())
                .minStockLimit(part.getMinStockLimit())
                .isLowStock(part.getStockQuantity() <= part.getMinStockLimit())
                .build();
    }

    public static OrderResponse toOrderResponse(Order order) {
        if (order == null) return null;

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .trackingCode(order.getTrackingCode())
                .client(toClientResponse(order.getClient()))
                .device(toDeviceResponse(order.getDevice()))
                .technicianId(order.getTechnician() != null ? order.getTechnician().getId() : null)
                .technicianName(order.getTechnician() != null ? order.getTechnician().getFullName() : null)
                .status(order.getStatus())
                .priority(order.getPriority())
                .defectDescription(order.getDefectDescription())
                .diagnosticsNotes(order.getDiagnosticsNotes())
                .estimatedCost(order.getEstimatedCost())
                .totalCost(order.getTotalCost())
                .createdAt(order.getCreatedAt())
                .completedAt(order.getCompletedAt())
                .parts(order.getOrderParts().stream()
                        .map(op -> OrderResponse.OrderPartItemResponse.builder()
                                .id(op.getId())
                                .sparePartId(op.getSparePart().getId())
                                .sku(op.getSparePart().getSku())
                                .name(op.getSparePart().getName())
                                .quantity(op.getQuantity())
                                .unitPrice(op.getUnitPrice())
                                .totalPrice(op.getUnitPrice().multiply(BigDecimal.valueOf(op.getQuantity())))
                                .build())
                        .collect(Collectors.toList()))
                .services(order.getOrderServices().stream()
                        .map(os -> OrderResponse.OrderServiceItemResponse.builder()
                                .id(os.getId())
                                .serviceId(os.getService().getId())
                                .name(os.getService().getName())
                                .price(os.getPrice())
                                .status(os.getStatus())
                                .build())
                        .collect(Collectors.toList()))
                .payments(order.getPayments().stream()
                        .map(p -> OrderResponse.PaymentItemResponse.builder()
                                .id(p.getId())
                                .amount(p.getAmount())
                                .paymentMethod(p.getPaymentMethod())
                                .transactionRef(p.getTransactionRef())
                                .paidAt(p.getPaidAt())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
