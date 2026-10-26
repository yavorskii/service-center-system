package ua.repairhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorVerifyRequest {
    @NotBlank(message = "Ім'я користувача є обов'язковим")
    private String username;

    @NotBlank(message = "Код підтвердження є обов'язковим")
    private String code;
}
