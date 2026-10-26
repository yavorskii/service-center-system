package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import ua.repairhub.dto.request.TwoFactorToggleRequest;
import ua.repairhub.dto.response.UserSecurityProfileResponse;
import ua.repairhub.service.AuthService;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@Tag(name = "User Profile & Security", description = "Перегляд власного профілю та налаштування 2FA")
public class ProfileController {

    private final AuthService authService;

    @GetMapping
    @Operation(summary = "Отримання власного профілю", description = "Перегляд статусу активації, ролі та налаштувань безпеки")
    public ResponseEntity<UserSecurityProfileResponse> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getUserProfile(userDetails.getUsername()));
    }

    @PostMapping("/2fa/toggle")
    @Operation(summary = "Перемикання 2FA", description = "Увімкнення або вимкнення двофакторної автентифікації")
    public ResponseEntity<UserSecurityProfileResponse> toggleTwoFactor(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody TwoFactorToggleRequest request) {
        return ResponseEntity.ok(authService.toggleTwoFactor(userDetails.getUsername(), request.getEnabled()));
    }
}
