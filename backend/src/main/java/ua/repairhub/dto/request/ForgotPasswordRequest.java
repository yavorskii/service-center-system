package ua.repairhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordRequest {
    @NotBlank(message = "Email або логін є обов'язковим")
    private String email;

    private String twoFactorCode;
}
