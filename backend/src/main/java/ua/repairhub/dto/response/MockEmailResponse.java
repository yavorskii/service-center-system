package ua.repairhub.dto.response;

import lombok.*;

import java.time.ZonedDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MockEmailResponse {
    private String id;
    private String toEmail;
    private String subject;
    private String body;
    private String token;
    private String type;
    private String actionUrl;
    private ZonedDateTime createdAt;
}
