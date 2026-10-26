package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ua.repairhub.dto.response.SecurityAuditResponse;
import ua.repairhub.service.AuthService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/security")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Security Audit", description = "Журнал аудиту входів, моніторинг Brute Force та блокування користувачів")
public class SecurityController {

    private final AuthService authService;

    @GetMapping("/audit-logs")
    @Operation(summary = "Журнал спроб входу", description = "Перегляд останніх 100 спроб входу з IP-адресами та статусами")
    public ResponseEntity<List<SecurityAuditResponse>> getAuditLogs() {
        return ResponseEntity.ok(authService.getAuditLogs());
    }

    @PostMapping("/users/{id}/lock")
    @Operation(summary = "Блокування акаунта", description = "Примусове блокування облікового запису адміністратором")
    public ResponseEntity<Map<String, String>> lockUser(@PathVariable Long id) {
        authService.lockUser(id);
        return ResponseEntity.ok(Map.of("message", "Обліковий запис успішно заблоковано"));
    }

    @PostMapping("/users/{id}/unlock")
    @Operation(summary = "Розблокування акаунта", description = "Зняття блокування з облікового запису адміністратором")
    public ResponseEntity<Map<String, String>> unlockUser(@PathVariable Long id) {
        authService.unlockUser(id);
        return ResponseEntity.ok(Map.of("message", "Обліковий запис успішно розблоковано"));
    }
}
