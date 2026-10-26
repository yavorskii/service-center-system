package ua.repairhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OAuthLoginRequest {
    @NotBlank(message = "Провайдер є обов'язковим")
    private String provider;

    @NotBlank(message = "Email є обов'язковим")
    private String email;

    @NotBlank(message = "ПІБ є обов'язковим")
    private String fullName;

    private String externalId;
}
