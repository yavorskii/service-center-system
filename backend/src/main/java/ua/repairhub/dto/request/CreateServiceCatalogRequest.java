package ua.repairhub.dto.request;

import jakarta.validation.constraints.DecimalMin;
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
public class CreateServiceCatalogRequest {

    @NotBlank(message = "Назва послуги є обов'язковою")
    private String name;

    private String description;

    @NotNull(message = "Стандартна вартість є обов'язковою")
    @DecimalMin(value = "0.0", message = "Вартість не може бути від'ємною")
    private BigDecimal standardPrice;
}
