package ua.repairhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Ім'я користувача є обов'язковим")
    private String username;

    @NotBlank(message = "Пароль є обов'язковим")
    private String password;
}
