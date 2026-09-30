package ua.repairhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SparePartResponse {
    private Long id;
    private String sku;
    private String name;
    private String category;
    private BigDecimal purchasePrice;
    private BigDecimal retailPrice;
    private Integer stockQuantity;
    private Integer minStockLimit;
    private boolean isLowStock;
}
