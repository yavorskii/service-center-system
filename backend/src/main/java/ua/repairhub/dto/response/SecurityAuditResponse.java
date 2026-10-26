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
    private String ipAddress;
    private ZonedDateTime attemptTime;
    private String status;
    private String details;
}
