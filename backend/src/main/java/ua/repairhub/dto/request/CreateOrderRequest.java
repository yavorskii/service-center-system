package ua.repairhub.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.repairhub.model.OrderPriority;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotBlank(message = "ПІБ клієнта є обов'язковим")
    private String clientName;

    @NotBlank(message = "Номер телефону клієнта є обов'язковим")
    @Pattern(regexp = "^\\+?[0-9]{10,13}$", message = "Формат телефону повинен бути +380XXXXXXXXX або 0XXXXXXXXX")
    private String clientPhone;

    private String clientEmail;

    private String clientAddress;

    @NotBlank(message = "Тип пристрою є обов'язковим (Ноутбук, Смартфон тощо)")
    private String deviceType;

    @NotBlank(message = "Бренд пристрою є обов'язковим")
    private String brand;

    @NotBlank(message = "Модель пристрою є обов'язковою")
    private String model;

    private String serialNumber;

    private String appearanceNotes;

    @NotBlank(message = "Опис несправності є обов'язковим")
    private String defectDescription;

    @Builder.Default
    private OrderPriority priority = OrderPriority.MEDIUM;

    @DecimalMin(value = "0.0", inclusive = true, message = "Орієнтовна вартість не може бути від'ємною")
    @Builder.Default
    private BigDecimal estimatedCost = BigDecimal.ZERO;
}
