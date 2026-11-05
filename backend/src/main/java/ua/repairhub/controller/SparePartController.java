package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ua.repairhub.dto.request.CreateSparePartRequest;
import ua.repairhub.dto.request.UpdateSparePartRequest;
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TECHNICIAN')")
    @Operation(summary = "Отримати список запчастин", description = "Пошук за назвою, категорією або SKU")
    public ResponseEntity<List<SparePartResponse>> getParts(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(sparePartService.getAllParts(search));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TECHNICIAN')")
    @Operation(summary = "Отримати запчастину за ID", description = "Дані про деталь та залишки")
    public ResponseEntity<SparePartResponse> getPartById(@PathVariable Long id) {
        return ResponseEntity.ok(sparePartService.getPartById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Додати нову позицію на склад", description = "Оприбуткування нової деталі в номенклатуру")
    public ResponseEntity<SparePartResponse> createPart(@Valid @RequestBody CreateSparePartRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sparePartService.createPart(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Оновити картку запчастини", description = "Зміна цін, категорії або мінімального залишку")
    public ResponseEntity<SparePartResponse> updatePart(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSparePartRequest request
    ) {
        return ResponseEntity.ok(sparePartService.updatePart(id, request));
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Поповнити або скоригувати запас деталі", description = "Зміна кількості залишків на складі (прихід партії або інвентаризація)")
    public ResponseEntity<SparePartResponse> updateStock(
            @PathVariable Long id,
            @RequestParam Integer quantity
    ) {
        return ResponseEntity.ok(sparePartService.updateStock(id, quantity));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Видалити позицію зі складу", description = "Видалення невикористаної номенклатурної позиції")
    public ResponseEntity<Void> deletePart(@PathVariable Long id) {
        sparePartService.deletePart(id);
        return ResponseEntity.noContent().build();
    }
}
