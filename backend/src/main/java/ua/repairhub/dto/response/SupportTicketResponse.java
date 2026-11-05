package ua.repairhub.dto.response;

import lombok.*;

import java.time.ZonedDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketResponse {
    private Long id;
    private String email;
    private String username;
    private Long userId;
    private String category;
    private String subject;
    private String description;
    private String ipAddress;
    private String status;
    private String adminNote;
    private String adminReply;
    private String repliedBy;
    private ZonedDateTime repliedAt;
    private ZonedDateTime createdAt;
    private UserResponse linkedUser;
    private List<SecurityAuditResponse> recentEvents;
}
