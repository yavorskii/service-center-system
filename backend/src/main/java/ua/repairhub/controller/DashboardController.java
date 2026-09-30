package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.repairhub.dto.response.DashboardStatsResponse;
import ua.repairhub.service.DashboardService;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Зведена статистика та аналітика сервісного центру")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @Operation(summary = "Отримати статистичні показники дашборду")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }
}
