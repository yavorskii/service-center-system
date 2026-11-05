package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.repairhub.dto.request.CreateOrderRequest;
import ua.repairhub.dto.response.OrderResponse;
import ua.repairhub.service.OrderService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tracking")
@RequiredArgsConstructor
@Tag(name = "Public Tracking", description = "Публічний портал онлайн-трекінгу та подачі заявок для клієнтів (без авторизації)")
public class TrackingController {

    private final OrderService orderService;

    @GetMapping("/search")
    @Operation(summary = "Пошук замовлень за трек-кодом, номером або телефоном", description = "Для клієнтського порталу")
    public ResponseEntity<List<OrderResponse>> searchPublicOrders(@RequestParam String query) {
        return ResponseEntity.ok(orderService.publicSearchOrders(query));
    }

    @PostMapping("/request")
    @Operation(summary = "Публічна онлайн-заявка на ремонт", description = "Створення нової заявки клієнтом із публічного порталу")
    public ResponseEntity<OrderResponse> createPublicOrderRequest(@Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request));
    }

    @GetMapping("/{trackingCode}")
    @Operation(summary = "Перевірка статусу за трек-кодом", description = "Отримання інформації про стан ремонту за унікальним номером квитанції")
    public ResponseEntity<OrderResponse> trackOrder(@PathVariable String trackingCode) {
        return ResponseEntity.ok(orderService.getOrderByTrackingCode(trackingCode));
    }
}
