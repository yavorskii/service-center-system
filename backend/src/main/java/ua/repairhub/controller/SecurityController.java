package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ua.repairhub.dto.request.AdminTicketUpdateRequest;
import ua.repairhub.dto.request.DeleteUserConfirmRequest;
import ua.repairhub.dto.response.SecurityAuditResponse;
import ua.repairhub.dto.response.SentEmailLogResponse;
import ua.repairhub.dto.response.SupportTicketResponse;
import ua.repairhub.service.AuthService;
import ua.repairhub.service.MockEmailService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/security")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Security Audit & Administration", description = "Панель адміністратора безпеки: аудит IP, блокування, видалення, листи та підтримка")
public class SecurityController {

    private final AuthService authService;
    private final MockEmailService mockEmailService;

    @GetMapping("/audit-logs")
    @Operation(summary = "Журнал аудиту подій безпеки")
    public ResponseEntity<List<SecurityAuditResponse>> getAuditLogs() {
        return ResponseEntity.ok(authService.getAuditLogs());
    }

    @GetMapping("/email-logs")
    @Operation(summary = "Журнал усіх надісланих системою листів")
    public ResponseEntity<List<SentEmailLogResponse>> getEmailLogs() {
        return ResponseEntity.ok(mockEmailService.getSentEmailLogs());
    }

    @GetMapping("/stats")
    @Operation(summary = "Додаткова статистика активних сеансів")
    public ResponseEntity<Map<String, Object>> getSecurityStats() {
        return ResponseEntity.ok(Map.of("activeSessions", authService.countActiveSessions()));
    }

    @GetMapping("/support-tickets")
    @Operation(summary = "Список звернень користувачів у службу безпеки")
    public ResponseEntity<List<SupportTicketResponse>> getSupportTickets() {
        return ResponseEntity.ok(authService.getAllSupportTickets());
    }

    @PatchMapping("/support-tickets/{id}")
    @Operation(summary = "Оновлення статусу інциденту або надсилання відповіді на Email")
    public ResponseEntity<SupportTicketResponse> updateSupportTicket(
            @PathVariable Long id,
            @RequestBody AdminTicketUpdateRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        String adminUsername = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(authService.updateSupportTicket(id, request, adminUsername, httpRequest));
    }

    @PostMapping("/users/{id}/lock")
    @Operation(summary = "Блокування акаунта")
    public ResponseEntity<Map<String, String>> lockUser(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        String adminUsername = authentication != null ? authentication.getName() : null;
        authService.lockUser(id, adminUsername, httpRequest);
        return ResponseEntity.ok(Map.of("message", "Обліковий запис успішно заблоковано"));
    }

    @PostMapping("/users/{id}/unlock")
    @Operation(summary = "Розблокування акаунта")
    public ResponseEntity<Map<String, String>> unlockUser(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        String adminUsername = authentication != null ? authentication.getName() : null;
        authService.unlockUser(id, adminUsername, httpRequest);
        return ResponseEntity.ok(Map.of("message", "Обліковий запис успішно розблоковано"));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Безпечне видалення акаунта з подвійним підтвердженням")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable Long id,
            @Valid @RequestBody DeleteUserConfirmRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        String adminUsername = authentication != null ? authentication.getName() : null;
        authService.deleteUserByAdmin(id, request, adminUsername, httpRequest);
        return ResponseEntity.ok(Map.of("message", "Обліковий запис остаточно видалено"));
    }
}
