package ua.repairhub.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TotpSetupResponse {
    private String secret;
    private String otpAuthUrl;
    private String qrCodeSvg;
}
