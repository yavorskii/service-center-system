package ua.repairhub.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "spare_parts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SparePart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "purchase_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "retail_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal retailPrice;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "min_stock_limit", nullable = false)
    @Builder.Default
    private Integer minStockLimit = 2;
}
