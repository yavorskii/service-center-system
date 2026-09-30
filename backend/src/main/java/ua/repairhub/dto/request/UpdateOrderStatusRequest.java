package ua.repairhub.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.repairhub.model.OrderStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderStatusRequest {

    @NotNull(message = "Новий статус замовлення є обов'язковим")
    private OrderStatus status;
}
