package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import ua.repairhub.dto.request.AddPartToOrderRequest;
import ua.repairhub.dto.request.AddServiceToOrderRequest;
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
@Tag(name = "Orders", description = "Управління замовленнями на ремонт техніки, списання запчастин та облік робіт")
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    @Operation(summary = "Отримати список замовлень", description = "Фільтрація за ключовим словом та статусом замовлення (для ROLE_USER — лише власні заявки)")
    public ResponseEntity<List<OrderResponse>> getOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OrderStatus status,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(orderService.getOrdersForUser(search, status, username));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Отримати замовлення за ID", description = "Детальна інформація про замовлення (для ROLE_USER — лише власні заявки)")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(orderService.getOrderByIdForUser(id, username));
    }

    @PostMapping
    @Operation(summary = "Створити нове замовлення", description = "Реєстрація клієнта, пристрою та генерація трек-коду")
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrderForUser(request, username));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TECHNICIAN')")
    @Operation(summary = "Змінити статус замовлення", description = "Оновлення життєвого циклу ремонту (при скасуванні деталі повертаються на склад)")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request.getStatus()));
    }

    @PatchMapping("/{id}/diagnostics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TECHNICIAN')")
    @Operation(summary = "Оновити дані діагностики", description = "Внесення технічного висновку майстра та орієнтовної вартості")
    public ResponseEntity<OrderResponse> updateDiagnostics(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDiagnosticsRequest request,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(orderService.updateDiagnostics(id, request, username));
    }

    @PostMapping("/{id}/parts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TECHNICIAN')")
    @Operation(summary = "Списати та додати запчастину до замовлення", description = "Списання залишку зі складу та перерахунок загальної вартості замовлення")
    public ResponseEntity<OrderResponse> addPart(
            @PathVariable Long id,
            @Valid @RequestBody AddPartToOrderRequest request,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(orderService.addPartToOrder(id, request, username));
    }

    @DeleteMapping("/{id}/parts/{orderPartId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TECHNICIAN')")
    @Operation(summary = "Повернути запчастину із замовлення на склад", description = "Видалення позиції з кошторису та повернення одиниць на баланс складу")
    public ResponseEntity<OrderResponse> removePart(
            @PathVariable Long id,
            @PathVariable Long orderPartId
    ) {
        return ResponseEntity.ok(orderService.removePartFromOrder(id, orderPartId));
    }

    @PostMapping("/{id}/services")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TECHNICIAN')")
    @Operation(summary = "Додати виконану роботу/послугу до замовлення", description = "Додавання послуги з прайсу або індивідуальної роботи з перерахунком вартості")
    public ResponseEntity<OrderResponse> addService(
            @PathVariable Long id,
            @Valid @RequestBody AddServiceToOrderRequest request,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(orderService.addServiceToOrder(id, request, username));
    }

    @DeleteMapping("/{id}/services/{orderServiceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TECHNICIAN')")
    @Operation(summary = "Видалити послугу із замовлення", description = "Видалення виконаної роботи з перерахунком загальної вартості")
    public ResponseEntity<OrderResponse> removeService(
            @PathVariable Long id,
            @PathVariable Long orderServiceId
    ) {
        return ResponseEntity.ok(orderService.removeServiceFromOrder(id, orderServiceId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Видалити замовлення", description = "Видалення замовлення з поверненням невиданих запчастин на склад")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}
