package ua.repairhub.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "order_services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderServiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceEntity service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private User technician;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "COMPLETED";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}
