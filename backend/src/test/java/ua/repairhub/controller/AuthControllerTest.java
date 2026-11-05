package ua.repairhub.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import ua.repairhub.dto.request.*;
import ua.repairhub.model.Role;
import ua.repairhub.service.TotpService;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TotpService totpService;

    private String[] fetchCaptcha() throws Exception {
        MvcResult res = mockMvc.perform(get("/api/v1/auth/captcha"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        String token = json.get("captchaToken").asText();
        String svg = json.get("captchaSvg").asText();
        Matcher m = Pattern.compile(">([2-9A-Z])</text>").matcher(svg);
        StringBuilder answer = new StringBuilder();
        while (m.find()) {
            answer.append(m.group(1));
        }
        return new String[]{token, answer.toString()};
    }

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
    @DisplayName("POST /api/v1/auth/login - Невірні облікові дані повертають 401 Unauthorized із залишком спроб")
    void login_InvalidCredentials_ReturnsUnauthorized() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .username("mgr_alina")
                .password("wrongpassword")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().username("mgr_alina").password("manager123").build())))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Валідація: короткий пароль повертає 400 Bad Request")
    void register_ValidationFailure_ReturnsBadRequest() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .username("new_user")
                .password("123")
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

    @Test
    @DisplayName("Lab 6 End-to-End: CAPTCHA, Реєстрація, Email-активація, 2FA, Brute Force, Відновлення пароля та RBAC")
    void fullSecurityLifecycle_Lab6_Success() throws Exception {
        RegisterRequest noCaptchaReq = RegisterRequest.builder()
                .username("sec_student")
                .password("Secure#2026")
                .fullName("Студент Тест")
                .email("sec_student@repairhub.ua")
                .role(Role.ROLE_ADMIN)
                .build();
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noCaptchaReq)))
                .andExpect(status().isBadRequest());

        String[] captcha = fetchCaptcha();
        RegisterRequest regReq = RegisterRequest.builder()
                .username("sec_student")
                .password("Secure#2026")
                .fullName("Студент Тест")
                .email("sec_student@repairhub.ua")
                .role(Role.ROLE_ADMIN)
                .captchaToken(captcha[0])
                .captchaAnswer(captcha[1])
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("ROLE_USER"))
                .andExpect(jsonPath("$.emailVerified").value(false));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().username("sec_student").password("Secure#2026").build())))
                .andExpect(status().isBadRequest());

        MvcResult emailsRes = mockMvc.perform(get("/api/v1/auth/emails"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode emails = objectMapper.readTree(emailsRes.getResponse().getContentAsString());
        String activationToken = emails.get(0).get("token").asText();
        assertThat(activationToken).isNotBlank();

        mockMvc.perform(post("/api/v1/auth/activate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ActivateAccountRequest(activationToken))))
                .andExpect(status().isOk());

        MvcResult userLoginRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().username("sec_student@repairhub.ua").password("Secure#2026").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.username").value("sec_student"))
                .andReturn();
        String userJwt = objectMapper.readTree(userLoginRes.getResponse().getContentAsString()).get("token").asText();

        mockMvc.perform(get("/api/v1/security/audit-logs").header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/warehouse/parts").header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/profile/2fa/toggle")
                        .header("Authorization", "Bearer " + userJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.twoFactorEnabled").value(true));

        MvcResult step1Res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().username("sec_student").password("Secure#2026").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requiresTwoFactor").value(true))
                .andExpect(jsonPath("$.tempToken").isString())
                .andReturn();
        String tempToken = objectMapper.readTree(step1Res.getResponse().getContentAsString()).get("tempToken").asText();

        JsonNode emailsAfter2fa = objectMapper.readTree(
                mockMvc.perform(get("/api/v1/auth/emails")).andReturn().getResponse().getContentAsString());
        String otpCode = emailsAfter2fa.get(0).get("token").asText();

        mockMvc.perform(post("/api/v1/auth/2fa/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                TwoFactorVerifyRequest.builder()
                                        .username("sec_student")
                                        .code(otpCode)
                                        .tempToken(tempToken)
                                        .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());

        for (int i = 1; i <= 4; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    LoginRequest.builder().username("sec_student").password("WrongPass!" + i).build())))
                    .andExpect(status().isUnauthorized());
        }
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().username("sec_student").password("WrongPass!5").build())))
                .andExpect(status().isLocked());

        mockMvc.perform(get("/api/v1/profile").header("Authorization", "Bearer " + userJwt))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"sec_student@repairhub.ua\"}"))
                .andExpect(status().isOk());

        JsonNode emailsAfterReset = objectMapper.readTree(
                mockMvc.perform(get("/api/v1/auth/emails")).andReturn().getResponse().getContentAsString());
        String resetToken = emailsAfterReset.get(0).get("token").asText();

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                ResetPasswordRequest.builder()
                                        .token(resetToken)
                                        .newPassword("NewStrong@2026")
                                        .build())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/oauth")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                OAuthLoginRequest.builder()
                                        .provider("GOOGLE")
                                        .email("oauth_student@gmail.com")
                                        .fullName("OAuth Student")
                                        .externalId("GOOGLE_oauth_student")
                                        .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.role").value("ROLE_USER"));
    }

    @Test
    @DisplayName("Активні сеанси, правило першого сеансу, TOTP QR 2FA, підтримка та видалення акаунта")
    void sessionsTotpSupportAndAdminDelete_Success() throws Exception {
        String[] captcha = fetchCaptcha();
        RegisterRequest regReq = RegisterRequest.builder()
                .username("totp_user")
                .password("Strong#2026")
                .fullName("Тест Сеансів")
                .email("totp_user@repairhub.ua")
                .captchaToken(captcha[0])
                .captchaAnswer(captcha[1])
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .header("X-Forwarded-For", "198.51.100.10")
                        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isCreated());

        JsonNode emails = objectMapper.readTree(
                mockMvc.perform(get("/api/v1/auth/emails")).andReturn().getResponse().getContentAsString());
        String activationToken = emails.get(0).get("token").asText();

        mockMvc.perform(post("/api/v1/auth/activate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ActivateAccountRequest(activationToken))))
                .andExpect(status().isOk());

        MvcResult session1Res = mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "198.51.100.10")
                        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().username("totp_user").password("Strong#2026").build())))
                .andExpect(status().isOk())
                .andReturn();
        String jwtPrimary = objectMapper.readTree(session1Res.getResponse().getContentAsString()).get("token").asText();

        MvcResult session2Res = mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "203.0.113.55")
                        .header("User-Agent", "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().username("totp_user").password("Strong#2026").build())))
                .andExpect(status().isOk())
                .andReturn();
        String jwtSecondary = objectMapper.readTree(session2Res.getResponse().getContentAsString()).get("token").asText();

        mockMvc.perform(get("/api/v1/profile/sessions").header("Authorization", "Bearer " + jwtPrimary))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].primary").value(true))
                .andExpect(jsonPath("$[0].current").value(true))
                .andExpect(jsonPath("$[0].ipAddress").value("198.51.100.10"))
                .andExpect(jsonPath("$[1].ipAddress").value("203.0.113.55"));

        mockMvc.perform(post("/api/v1/profile/sessions/terminate-others")
                        .header("Authorization", "Bearer " + jwtSecondary))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/profile/sessions/terminate-others")
                        .header("Authorization", "Bearer " + jwtPrimary))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.terminatedCount").value(1));

        mockMvc.perform(get("/api/v1/profile").header("Authorization", "Bearer " + jwtSecondary))
                .andExpect(status().isForbidden());

        MvcResult totpSetupRes = mockMvc.perform(post("/api/v1/profile/2fa/totp/setup")
                        .header("Authorization", "Bearer " + jwtPrimary))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.secret").isString())
                .andExpect(jsonPath("$.qrCodeSvg").isString())
                .andReturn();
        String secret = objectMapper.readTree(totpSetupRes.getResponse().getContentAsString()).get("secret").asText();

        mockMvc.perform(post("/api/v1/profile/2fa/totp/enable")
                        .header("Authorization", "Bearer " + jwtPrimary)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TotpEnableRequest(secret, "000000"))))
                .andExpect(status().isBadRequest());

        String validTotp = totpService.getCurrentCode(secret);
        mockMvc.perform(post("/api/v1/profile/2fa/totp/enable")
                        .header("Authorization", "Bearer " + jwtPrimary)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TotpEnableRequest(secret, validTotp))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.twoFactorEnabled").value(true))
                .andExpect(jsonPath("$.twoFactorMethod").value("TOTP"));

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"totp_user@repairhub.ua\"}"))
                .andExpect(status().isBadRequest());

        MvcResult ticketRes = mockMvc.perform(post("/api/v1/auth/support")
                        .header("X-Forwarded-For", "198.51.100.10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateSupportTicketRequest.builder()
                                .email("totp_user@repairhub.ua")
                                .category("SUSPICIOUS_ACTIVITY")
                                .subject("Підозрілі спроби входу")
                                .description("Хтось намагається підібрати пароль!")
                                .build())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andReturn();
        long ticketId = objectMapper.readTree(ticketRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult adminLoginRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().username("admin_oleg").password("admin123").build())))
                .andExpect(status().isOk())
                .andReturn();
        String adminJwt = objectMapper.readTree(adminLoginRes.getResponse().getContentAsString()).get("token").asText();

        mockMvc.perform(patch("/api/v1/security/support-tickets/" + ticketId)
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(AdminTicketUpdateRequest.builder()
                                .status("RESOLVED")
                                .adminNote("Перевірено IP")
                                .replyMessage("Акаунт перевірено та захищено!")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.adminReply").value("Акаунт перевірено та захищено!"));

        MvcResult profileRes = mockMvc.perform(get("/api/v1/profile").header("Authorization", "Bearer " + jwtPrimary))
                .andExpect(status().isOk())
                .andReturn();
        long targetUserId = objectMapper.readTree(profileRes.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(delete("/api/v1/security/users/" + targetUserId)
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DeleteUserConfirmRequest("wrong@mail.com", "ВИДАЛИТИ"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(delete("/api/v1/security/users/" + targetUserId)
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DeleteUserConfirmRequest("totp_user@repairhub.ua", "ВИДАЛИТИ"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().username("totp_user").password("Strong#2026").build())))
                .andExpect(status().isUnauthorized());
    }
}
