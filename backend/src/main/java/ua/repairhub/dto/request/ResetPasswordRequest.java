package ua.repairhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {
    @NotBlank(message = "Токен відновлення є обов'язковим")
    private String token;

    @NotBlank(message = "Новий пароль є обов'язковим")
    private String newPassword;
}
