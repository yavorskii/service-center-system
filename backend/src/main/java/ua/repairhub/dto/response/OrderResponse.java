package ua.repairhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.repairhub.model.OrderPriority;
import ua.repairhub.model.OrderStatus;
import ua.repairhub.model.PaymentMethod;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private String trackingCode;
    private ClientResponse client;
    private DeviceResponse device;
    private Long technicianId;
    private String technicianName;
    private OrderStatus status;
    private OrderPriority priority;
    private String defectDescription;
    private String diagnosticsNotes;
    private BigDecimal estimatedCost;
    private BigDecimal totalCost;
    private ZonedDateTime createdAt;
    private ZonedDateTime completedAt;

    @Builder.Default
    private List<OrderPartItemResponse> parts = new ArrayList<>();

    @Builder.Default
    private List<OrderServiceItemResponse> services = new ArrayList<>();

    @Builder.Default
    private List<PaymentItemResponse> payments = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderPartItemResponse {
        private Long id;
        private Long sparePartId;
        private String sku;
        private String name;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderServiceItemResponse {
        private Long id;
        private Long serviceId;
        private String name;
        private BigDecimal price;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentItemResponse {
        private Long id;
        private BigDecimal amount;
        private PaymentMethod paymentMethod;
        private String transactionRef;
        private ZonedDateTime paidAt;
    }
}
