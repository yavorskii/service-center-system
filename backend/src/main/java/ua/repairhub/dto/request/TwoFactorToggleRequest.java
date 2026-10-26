package ua.repairhub.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorToggleRequest {
    private Boolean enabled;
}
