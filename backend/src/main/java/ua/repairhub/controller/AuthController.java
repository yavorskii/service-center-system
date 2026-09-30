package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.repairhub.dto.request.LoginRequest;
import ua.repairhub.dto.request.RegisterRequest;
import ua.repairhub.dto.response.AuthResponse;
import ua.repairhub.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Автентифікація та реєстрація персоналу")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Вхід у систему", description = "Отримання JWT Bearer токена за логіном та паролем")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    @Operation(summary = "Реєстрація нового співробітника", description = "Створення нового користувача сервісного центру")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }
}
