package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.repairhub.dto.response.OrderResponse;
import ua.repairhub.service.OrderService;

@RestController
@RequestMapping("/api/v1/tracking")
@RequiredArgsConstructor
@Tag(name = "Public Tracking", description = "Публічний портал онлайн-трекінгу ремонту для клієнтів (без авторизації)")
public class TrackingController {

    private final OrderService orderService;

    @GetMapping("/{trackingCode}")
    @Operation(summary = "Перевірка статусу за трек-кодом", description = "Отримання інформації про стан ремонту за унікальним номером квитанції")
    public ResponseEntity<OrderResponse> trackOrder(@PathVariable String trackingCode) {
        return ResponseEntity.ok(orderService.getOrderByTrackingCode(trackingCode));
    }
}
