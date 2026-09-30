package ua.repairhub.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddPartToOrderRequest {

    @NotNull(message = "ID деталі є обов'язковим")
    private Long sparePartId;

    @NotNull(message = "Кількість є обов'язковою")
    @Min(value = 1, message = "Кількість повинна бути не менше 1")
    private Integer quantity;
}
