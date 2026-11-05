package ua.repairhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.repairhub.model.Role;

import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String fullName;
    private Role role;
    private String phone;
    private String email;
    private Boolean emailVerified;
    private Boolean isLocked;
    private ZonedDateTime lockedUntil;
    private Integer failedLoginAttempts;
    private Boolean twoFactorEnabled;
    private String twoFactorMethod;
    private String authProvider;
    private String googleEmail;
    private String lastLoginIp;
    private ZonedDateTime lastLoginAt;
    private Boolean isActive;
    private ZonedDateTime createdAt;
}
