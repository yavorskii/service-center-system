package ua.repairhub.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminTicketUpdateRequest {
    private String status;
    private String adminNote;
    private String replyMessage;
}
