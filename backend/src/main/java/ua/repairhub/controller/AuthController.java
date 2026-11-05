package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.repairhub.dto.request.*;
import ua.repairhub.dto.response.AuthResponse;
import ua.repairhub.dto.response.CaptchaResponse;
import ua.repairhub.dto.response.MockEmailResponse;
import ua.repairhub.dto.response.SupportTicketResponse;
import ua.repairhub.service.AuthService;
import ua.repairhub.service.CaptchaService;
import ua.repairhub.service.MockEmailService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & Security", description = "Безпечне керування обліковими записами, RBAC, 2FA, CAPTCHA, сеанси та аудит")
public class AuthController {

    private final AuthService authService;
    private final CaptchaService captchaService;
    private final MockEmailService mockEmailService;

    @PostMapping("/login")
    @Operation(summary = "Вхід у систему", description = "Автентифікація з перевіркою Brute Force, CAPTCHA, блокування та 2FA")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    @PostMapping("/logout")
    @Operation(summary = "Вихід із системи", description = "Завершення поточного серверного сеансу та запис у журнал аудиту")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest httpRequest) {
        String token = (authHeader != null && authHeader.startsWith("Bearer ")) ? authHeader.substring(7) : null;
        authService.logout(token, httpRequest);
        return ResponseEntity.ok(Map.of("message", "Сеанс успішно завершено"));
    }

    @PostMapping("/2fa/verify")
    @Operation(summary = "Підтвердження 2FA коду", description = "Перевірка 6-значного TOTP або OTP-коду для завершення входу")
    public ResponseEntity<AuthResponse> verifyTwoFactor(@Valid @RequestBody TwoFactorVerifyRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.verifyTwoFactor(request, httpRequest));
    }

    @PostMapping("/register")
    @Operation(summary = "Реєстрація користувача", description = "Реєстрація з перевіркою політики пароля та CAPTCHA")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request, httpRequest));
    }

    @GetMapping("/captcha")
    @Operation(summary = "Отримання CAPTCHA", description = "Генерація нового графічного коду та токена перевірки")
    public ResponseEntity<CaptchaResponse> getCaptcha() {
        return ResponseEntity.ok(captchaService.generateCaptcha());
    }

    @PostMapping("/activate")
    @Operation(summary = "Активація акаунта", description = "Підтвердження email через одноразовий токен")
    public ResponseEntity<Map<String, String>> activateAccount(@Valid @RequestBody ActivateAccountRequest request, HttpServletRequest httpRequest) {
        String msg = authService.activateAccount(request, httpRequest);
        return ResponseEntity.ok(Map.of("message", msg));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Запит на відновлення пароля", description = "Генерація токена з перевіркою 2FA та відправка листа на email")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        String msg = authService.forgotPassword(request, httpRequest);
        return ResponseEntity.ok(Map.of("message", msg));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Встановлення нового пароля", description = "Зміна пароля за токеном із перевіркою політики та завершенням активних сесій")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request, HttpServletRequest httpRequest) {
        String msg = authService.resetPassword(request, httpRequest);
        return ResponseEntity.ok(Map.of("message", msg));
    }

    @PostMapping("/support")
    @Operation(summary = "Звернення у службу безпеки та підтримки", description = "Повідомлення про підозрілу активність або заблокований акаунт")
    public ResponseEntity<SupportTicketResponse> createSupportTicket(
            @Valid @RequestBody CreateSupportTicketRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.createSupportTicket(request, httpRequest));
    }

    @PostMapping("/oauth")
    @Operation(summary = "Вхід через сторонній сервіс (OAuth2 / OIDC)", description = "Автентифікація через Google або GitHub")
    public ResponseEntity<AuthResponse> oauthLogin(@Valid @RequestBody OAuthLoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.oauthLogin(request, httpRequest));
    }

    @GetMapping("/google/url")
    @Operation(summary = "URL авторизації Google OAuth 2.0", description = "Повертає офіційний URL переходу на Google Account Chooser")
    public ResponseEntity<Map<String, String>> getGoogleAuthUrl(@RequestParam(required = false) String redirectUri) {
        return ResponseEntity.ok(Map.of("url", authService.getGoogleAuthorizationUrl(redirectUri)));
    }

    @PostMapping("/google/callback")
    @Operation(summary = "Обмін коду Google OAuth 2.0 на JWT", description = "Перевіряє одноразовий код у Google з урахуванням прив'язки та 2FA")
    public ResponseEntity<AuthResponse> googleCallback(@Valid @RequestBody GoogleCodeRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.authenticateWithGoogleCode(request, httpRequest));
    }

    @GetMapping("/emails")
    @Operation(summary = "Отримання списку листів", description = "Перегляд надісланих системних листів")
    public ResponseEntity<List<MockEmailResponse>> getSentEmails() {
        return ResponseEntity.ok(mockEmailService.getAllEmails());
    }

    @DeleteMapping("/emails")
    @Operation(summary = "Очищення кешу листів")
    public ResponseEntity<Void> clearEmails() {
        mockEmailService.clear();
        return ResponseEntity.noContent().build();
    }
}
