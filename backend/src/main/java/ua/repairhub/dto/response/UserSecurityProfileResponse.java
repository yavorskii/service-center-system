package ua.repairhub.dto.response;

import lombok.*;
import ua.repairhub.model.Role;

import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSecurityProfileResponse {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private Role role;
    private Boolean emailVerified;
    private Boolean twoFactorEnabled;
    private Boolean isLocked;
    private Integer failedLoginAttempts;
    private String authProvider;
    private Boolean isActive;
    private ZonedDateTime createdAt;
}
