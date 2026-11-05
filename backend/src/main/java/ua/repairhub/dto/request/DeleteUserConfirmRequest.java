package ua.repairhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteUserConfirmRequest {
    @NotBlank(message = "Введіть email або логін акаунта для підтвердження")
    private String confirmIdentifier;

    @NotBlank(message = "Введіть ключове слово ВИДАЛИТИ")
    private String confirmKeyword;
}
