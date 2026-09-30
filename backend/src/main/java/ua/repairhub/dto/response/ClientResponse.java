package ua.repairhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private String address;
    private String notes;
    private ZonedDateTime createdAt;
}
