package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import ua.repairhub.dto.request.GoogleCodeRequest;
import ua.repairhub.dto.request.TotpEnableRequest;
import ua.repairhub.dto.request.TwoFactorToggleRequest;
import ua.repairhub.dto.request.UpdateProfileDetailsRequest;
import ua.repairhub.dto.response.SecurityAuditResponse;
import ua.repairhub.dto.response.TotpSetupResponse;
import ua.repairhub.dto.response.UserSecurityProfileResponse;
import ua.repairhub.dto.response.UserSessionResponse;
import ua.repairhub.security.JwtService;
import ua.repairhub.service.AuthService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@Tag(name = "User Profile & Security", description = "Керування профілем, TOTP 2FA, активними сеансами, Google-прив'язкою та власним журналом безпеки")
public class ProfileController {

    private final AuthService authService;
    private final JwtService jwtService;

    @GetMapping
    @Operation(summary = "Отримання власного профілю")
    public ResponseEntity<UserSecurityProfileResponse> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getUserProfile(userDetails.getUsername()));
    }

    @PutMapping("/details")
    @Operation(summary = "Оновлення імені, телефону або логіна для входу")
    public ResponseEntity<UserSecurityProfileResponse> updateDetails(
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication,
            @RequestBody UpdateProfileDetailsRequest request,
            HttpServletRequest httpRequest) {
        String sessionToken = extractCurrentSessionToken(authentication);
        return ResponseEntity.ok(authService.updateProfileDetails(userDetails.getUsername(), request, sessionToken, httpRequest));
    }

    @PostMapping("/2fa/toggle")
    @Operation(summary = "Перемикання Email 2FA або вимкнення 2FA")
    public ResponseEntity<UserSecurityProfileResponse> toggleTwoFactor(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody TwoFactorToggleRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.toggleTwoFactor(userDetails.getUsername(), request.getEnabled(), httpRequest));
    }

    @PostMapping("/2fa/totp/setup")
    @Operation(summary = "Генерація секрету та QR-коду TOTP (Google Authenticator)")
    public ResponseEntity<TotpSetupResponse> setupTotp(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.setupTotp(userDetails.getUsername(), httpRequest));
    }

    @PostMapping("/2fa/totp/enable")
    @Operation(summary = "Підтвердження та увімкнення TOTP 2FA")
    public ResponseEntity<UserSecurityProfileResponse> enableTotp(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TotpEnableRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.enableTotp(userDetails.getUsername(), request, httpRequest));
    }

    @PostMapping("/google/link")
    @Operation(summary = "Прив'язка Google-акаунта до поточного профілю")
    public ResponseEntity<UserSecurityProfileResponse> linkGoogle(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody GoogleCodeRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.linkGoogleAccount(userDetails.getUsername(), request, httpRequest));
    }

    @PostMapping("/google/unlink")
    @Operation(summary = "Від'єднання Google-акаунта від профілю")
    public ResponseEntity<UserSecurityProfileResponse> unlinkGoogle(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.unlinkGoogleAccount(userDetails.getUsername(), httpRequest));
    }

    @GetMapping("/sessions")
    @Operation(summary = "Список активних сеансів користувача")
    public ResponseEntity<List<UserSessionResponse>> getActiveSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication) {
        String sessionToken = extractCurrentSessionToken(authentication);
        return ResponseEntity.ok(authService.getActiveSessions(userDetails.getUsername(), sessionToken));
    }

    @PostMapping("/sessions/terminate-others")
    @Operation(summary = "Завершити всі інші активні сеанси")
    public ResponseEntity<Map<String, Object>> terminateOtherSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        String sessionToken = extractCurrentSessionToken(authentication);
        return ResponseEntity.ok(authService.terminateOtherSessions(userDetails.getUsername(), sessionToken, httpRequest));
    }

    @DeleteMapping("/sessions/{id}")
    @Operation(summary = "Завершити конкретний інший сеанс")
    public ResponseEntity<Map<String, String>> terminateSession(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        String sessionToken = extractCurrentSessionToken(authentication);
        authService.terminateSessionById(userDetails.getUsername(), id, sessionToken, httpRequest);
        return ResponseEntity.ok(Map.of("message", "Сеанс завершено"));
    }

    @GetMapping("/events")
    @Operation(summary = "Персональний журнал подій безпеки користувача")
    public ResponseEntity<List<SecurityAuditResponse>> getPersonalEvents(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getPersonalSecurityEvents(userDetails.getUsername()));
    }

    private String extractCurrentSessionToken(Authentication authentication) {
        if (authentication != null && authentication.getCredentials() instanceof String jwt && !jwt.isBlank()) {
            try {
                return jwtService.extractSessionId(jwt);
            } catch (Exception ignored) {
            }
        }
        return null;
    }
}
