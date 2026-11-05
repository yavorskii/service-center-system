package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ua.repairhub.dto.request.CreateServiceCatalogRequest;
import ua.repairhub.dto.response.ServiceCatalogResponse;
import ua.repairhub.exception.DuplicateResourceException;
import ua.repairhub.model.ServiceEntity;
import ua.repairhub.repository.ServiceRepository;
import ua.repairhub.service.DtoMapper;

import java.util.List;

@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
@Tag(name = "Services Catalog", description = "Прайс-лист стандартних робіт та послуг сервісного центру")
public class ServiceCatalogController {

    private final ServiceRepository serviceRepository;

    @GetMapping
    @Operation(summary = "Отримати прайс-лист послуг", description = "Перелік стандартних робіт сервісного центру")
    public ResponseEntity<List<ServiceCatalogResponse>> getAllServices() {
        List<ServiceCatalogResponse> list = serviceRepository.findAllByOrderByNameAsc().stream()
                .map(DtoMapper::toServiceCatalogResponse)
                .toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Додати нову послугу в прайс", description = "Створення нової позиції у довіднику робіт")
    public ResponseEntity<ServiceCatalogResponse> createService(@Valid @RequestBody CreateServiceCatalogRequest request) {
        String trimmedName = request.getName().trim();
        if (serviceRepository.findByNameIgnoreCase(trimmedName).isPresent()) {
            throw new DuplicateResourceException("Послуга з назвою '" + trimmedName + "' вже існує у прайсі");
        }
        ServiceEntity entity = ServiceEntity.builder()
                .name(trimmedName)
                .description(request.getDescription())
                .standardPrice(request.getStandardPrice())
                .build();
        entity = serviceRepository.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(DtoMapper.toServiceCatalogResponse(entity));
    }
}
