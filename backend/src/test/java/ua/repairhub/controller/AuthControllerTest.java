package ua.repairhub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ua.repairhub.dto.request.LoginRequest;
import ua.repairhub.dto.request.RegisterRequest;
import ua.repairhub.model.Role;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("POST /api/v1/auth/login - Успішна аутентифікація повертає 200 та JWT Bearer токен")
    void login_Success() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .username("admin_oleg")
                .password("admin123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.username").value("admin_oleg"))
                .andExpect(jsonPath("$.role").value("ROLE_ADMIN"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Невірні облікові дані повертають 401 Unauthorized")
    void login_InvalidCredentials_ReturnsUnauthorized() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .username("admin_oleg")
                .password("wrongpassword")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Валідація: короткий пароль повертає 400 Bad Request")
    void register_ValidationFailure_ReturnsBadRequest() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .username("new_user")
                .password("123") // короткий пароль (< 6 символів)
                .fullName("Тестовий Користувач")
                .role(Role.ROLE_TECHNICIAN)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.password").exists());
    }
}
