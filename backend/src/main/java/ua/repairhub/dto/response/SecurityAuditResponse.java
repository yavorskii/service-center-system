package ua.repairhub.dto.response;

import lombok.*;

import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityAuditResponse {
    private Long id;
    private String username;
    private String actorUsername;
    private String userIpAddress;
    private String ipAddress;
    private String userAgent;
    private ZonedDateTime attemptTime;
    private String status;
    private String details;
}
