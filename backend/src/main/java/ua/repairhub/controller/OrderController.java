package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.repairhub.dto.request.AddPartToOrderRequest;
import ua.repairhub.dto.request.CreateOrderRequest;
import ua.repairhub.dto.request.UpdateDiagnosticsRequest;
import ua.repairhub.dto.request.UpdateOrderStatusRequest;
import ua.repairhub.dto.response.OrderResponse;
import ua.repairhub.model.OrderStatus;
import ua.repairhub.service.OrderService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Управління замовленнями на ремонт техніки")
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    @Operation(summary = "Отримати список замовлень", description = "Фільтрація за ключовим словом та статусом замовлення")
    public ResponseEntity<List<OrderResponse>> getOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OrderStatus status
    ) {
        return ResponseEntity.ok(orderService.getOrders(search, status));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Отримати замовлення за ID", description = "Детальна інформація про замовлення, клієнта, техніку та деталі")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PostMapping
    @Operation(summary = "Створити нове замовлення", description = "Реєстрація клієнта, пристрою та генерація трек-коду")
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Змінити статус замовлення", description = "Оновлення життєвого циклу ремонту")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request.getStatus()));
    }

    @PatchMapping("/{id}/diagnostics")
    @Operation(summary = "Оновити дані діагностики", description = "Внесення технічного висновку майстра")
    public ResponseEntity<OrderResponse> updateDiagnostics(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDiagnosticsRequest request
    ) {
        return ResponseEntity.ok(orderService.updateDiagnostics(id, request));
    }

    @PostMapping("/{id}/parts")
    @Operation(summary = "Списати та додати запчастину до замовлення", description = "Контроль залишків на складі та перерахунок загальної вартості")
    public ResponseEntity<OrderResponse> addPart(
            @PathVariable Long id,
            @Valid @RequestBody AddPartToOrderRequest request
    ) {
        return ResponseEntity.ok(orderService.addPartToOrder(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Видалити замовлення", description = "Каскадне видалення замовлення з бази даних")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}
