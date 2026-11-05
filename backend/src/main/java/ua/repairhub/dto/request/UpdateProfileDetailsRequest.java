package ua.repairhub.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileDetailsRequest {
    private String fullName;
    private String phone;
    private String newUsername;
    private String currentPassword;
}
