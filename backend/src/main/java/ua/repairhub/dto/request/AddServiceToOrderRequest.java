package ua.repairhub.dto.request;

import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddServiceToOrderRequest {

    private Long serviceId;

    private String customServiceName;

    @DecimalMin(value = "0.0", message = "Вартість послуги не може бути від'ємною")
    private BigDecimal price;
}
