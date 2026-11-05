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
    private String twoFactorMethod;
    private Boolean isLocked;
    private Integer failedLoginAttempts;
    private String authProvider;
    private Boolean googleConnected;
    private String googleEmail;
    private String lastLoginIp;
    private ZonedDateTime lastLoginAt;
    private Boolean isActive;
    private ZonedDateTime createdAt;
    private String updatedToken;
}
