package ua.repairhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.repairhub.model.Role;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long id;
    private String username;
    private String fullName;
    private Role role;
}
