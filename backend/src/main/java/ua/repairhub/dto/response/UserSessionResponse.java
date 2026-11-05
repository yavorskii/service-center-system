package ua.repairhub.dto.response;

import lombok.*;

import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSessionResponse {
    private Long id;
    private String ipAddress;
    private String deviceInfo;
    private ZonedDateTime createdAt;
    private ZonedDateTime lastActiveAt;
    private Boolean current;
    private Boolean primary;
    private Boolean canTerminate;
}
