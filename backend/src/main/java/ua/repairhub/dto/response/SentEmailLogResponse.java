package ua.repairhub.dto.response;

import lombok.*;

import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentEmailLogResponse {
    private Long id;
    private String recipientEmail;
    private String username;
    private String subject;
    private String emailType;
    private String deliveryStatus;
    private ZonedDateTime sentAt;
}
