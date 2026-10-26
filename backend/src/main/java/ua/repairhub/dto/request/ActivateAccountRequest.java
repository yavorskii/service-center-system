package ua.repairhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivateAccountRequest {
    @NotBlank(message = "Токен активації є обов'язковим")
    private String token;
}
