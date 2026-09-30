package ua.repairhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.repairhub.model.Role;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Логін не може бути порожнім")
    @Size(min = 3, max = 50, message = "Логін повинен містити від 3 до 50 символів")
    private String username;

    @NotBlank(message = "Пароль не може бути порожнім")
    @Size(min = 6, message = "Пароль повинен містити не менше 6 символів")
    private String password;

    @NotBlank(message = "ПІБ є обов'язковим")
    private String fullName;

    @NotNull(message = "Роль користувача є обов'язковою")
    private Role role;

    private String phone;
}
