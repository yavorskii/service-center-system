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
import ua.repairhub.service.AuthService;
import ua.repairhub.service.CaptchaService;
import ua.repairhub.service.MockEmailService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & Security", description = "Безпечне керування обліковими записами, RBAC, 2FA, CAPTCHA та аудит")
public class AuthController {

    private final AuthService authService;
    private final CaptchaService captchaService;
    private final MockEmailService mockEmailService;

    @PostMapping("/login")
    @Operation(summary = "Вхід у систему", description = "Автентифікація з перевіркою Brute Force, блокування та 2FA")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    @PostMapping("/2fa/verify")
    @Operation(summary = "Підтвердження 2FA коду", description = "Перевірка 6-значного OTP-коду для завершення входу")
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
    public ResponseEntity<Map<String, String>> activateAccount(@Valid @RequestBody ActivateAccountRequest request) {
        String msg = authService.activateAccount(request);
        return ResponseEntity.ok(Map.of("message", msg));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Запит на відновлення пароля", description = "Генерація токена та відправка листа на email")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String msg = authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", msg));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Встановлення нового пароля", description = "Зміна пароля за токеном із перевіркою політики")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String msg = authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", msg));
    }

    @PostMapping("/oauth")
    @Operation(summary = "Вхід через сторонній сервіс (OAuth2 / OIDC)", description = "Автентифікація через Google або GitHub")
    public ResponseEntity<AuthResponse> oauthLogin(@Valid @RequestBody OAuthLoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.oauthLogin(request, httpRequest));
    }

    @GetMapping("/emails")
    @Operation(summary = "Отримання списку листів (Mock Mailbox)", description = "Перегляд надісланих системних листів для відеозвіту")
    public ResponseEntity<List<MockEmailResponse>> getSentEmails() {
        return ResponseEntity.ok(mockEmailService.getAllEmails());
    }

    @DeleteMapping("/emails")
    @Operation(summary = "Очищення поштової скриньки")
    public ResponseEntity<Void> clearEmails() {
        mockEmailService.clear();
        return ResponseEntity.noContent().build();
    }
}
