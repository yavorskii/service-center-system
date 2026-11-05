package ua.repairhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TotpEnableRequest {
    @NotBlank(message = "Секретний ключ обов'язковий")
    private String secret;

    @NotBlank(message = "Код підтвердження обов'язковий")
    private String code;
}
