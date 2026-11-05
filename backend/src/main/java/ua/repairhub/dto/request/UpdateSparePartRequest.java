package ua.repairhub.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSparePartRequest {

    @NotBlank(message = "Найменування деталі є обов'язковим")
    private String name;

    @NotBlank(message = "Категорія є обов'язковою")
    private String category;

    @NotNull(message = "Закупівельна ціна є обов'язковою")
    @DecimalMin(value = "0.0", message = "Закупівельна ціна не може бути від'ємною")
    private BigDecimal purchasePrice;

    @NotNull(message = "Ціна продажу є обов'язковою")
    @DecimalMin(value = "0.0", message = "Ціна продажу не може бути від'ємною")
    private BigDecimal retailPrice;

    @NotNull(message = "Мінімальний ліміт є обов'язковим")
    @Min(value = 0, message = "Мінімальний ліміт не може бути менше 0")
    private Integer minStockLimit;
}
