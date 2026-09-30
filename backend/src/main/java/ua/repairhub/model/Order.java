package ua.repairhub.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 30)
    private String orderNumber;

    @Column(name = "tracking_code", nullable = false, unique = true, length = 32)
    private String trackingCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private User technician;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private OrderStatus status = OrderStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OrderPriority priority = OrderPriority.MEDIUM;

    @Column(name = "defect_description", nullable = false, columnDefinition = "TEXT")
    private String defectDescription;

    @Column(name = "diagnostics_notes", columnDefinition = "TEXT")
    private String diagnosticsNotes;

    @Column(name = "estimated_cost", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal estimatedCost = BigDecimal.ZERO;

    @Column(name = "total_cost", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalCost = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "completed_at")
    private ZonedDateTime completedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderPart> orderParts = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderServiceEntity> orderServices = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();
}
