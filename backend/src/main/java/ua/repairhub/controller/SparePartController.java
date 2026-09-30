package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.repairhub.dto.request.CreateSparePartRequest;
import ua.repairhub.dto.response.SparePartResponse;
import ua.repairhub.service.SparePartService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/warehouse/parts")
@RequiredArgsConstructor
@Tag(name = "Warehouse", description = "Складський облік деталей, комплектуючих та розхідних матеріалів")
public class SparePartController {

    private final SparePartService sparePartService;

    @GetMapping
    @Operation(summary = "Отримати список запчастин", description = "Пошук за назвою, категорією або SKU")
    public ResponseEntity<List<SparePartResponse>> getParts(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(sparePartService.getAllParts(search));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Отримати запчастину за ID", description = "Дані про деталь та залишки")
    public ResponseEntity<SparePartResponse> getPartById(@PathVariable Long id) {
        return ResponseEntity.ok(sparePartService.getPartById(id));
    }

    @PostMapping
    @Operation(summary = "Додати нову позицію на склад", description = "Реєстрація нової деталі")
    public ResponseEntity<SparePartResponse> createPart(@Valid @RequestBody CreateSparePartRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sparePartService.createPart(request));
    }

    @PatchMapping("/{id}/stock")
    @Operation(summary = "Поповнити запас деталі", description = "Збільшення кількості залишків на складі")
    public ResponseEntity<SparePartResponse> updateStock(
            @PathVariable Long id,
            @RequestParam Integer quantity
    ) {
        return ResponseEntity.ok(sparePartService.updateStock(id, quantity));
    }
}
