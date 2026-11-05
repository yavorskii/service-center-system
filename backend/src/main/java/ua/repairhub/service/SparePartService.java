package ua.repairhub.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.repairhub.dto.request.CreateSparePartRequest;
import ua.repairhub.dto.request.UpdateSparePartRequest;
import ua.repairhub.dto.response.SparePartResponse;
import ua.repairhub.exception.BadRequestException;
import ua.repairhub.exception.DuplicateResourceException;
import ua.repairhub.exception.ResourceNotFoundException;
import ua.repairhub.model.SparePart;
import ua.repairhub.repository.OrderPartRepository;
import ua.repairhub.repository.SparePartRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SparePartService {

    private final SparePartRepository sparePartRepository;
    private final OrderPartRepository orderPartRepository;

    @Transactional(readOnly = true)
    public List<SparePartResponse> getAllParts(String query) {
        return sparePartRepository.searchSpareParts(query).stream()
                .map(DtoMapper::toSparePartResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SparePartResponse getPartById(Long id) {
        SparePart part = sparePartRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Деталь з ID " + id + " не знайдено"));
        return DtoMapper.toSparePartResponse(part);
    }

    @Transactional
    public SparePartResponse createPart(CreateSparePartRequest request) {
        String normalizedSku = request.getSku().trim().toUpperCase();
        if (sparePartRepository.existsBySku(normalizedSku)) {
            throw new DuplicateResourceException("Деталь з артикулом " + normalizedSku + " вже існує на складі");
        }

        SparePart part = SparePart.builder()
                .sku(normalizedSku)
                .name(request.getName().trim())
                .category(request.getCategory().trim())
                .purchasePrice(request.getPurchasePrice())
                .retailPrice(request.getRetailPrice())
                .stockQuantity(request.getStockQuantity())
                .minStockLimit(request.getMinStockLimit() != null ? request.getMinStockLimit() : 2)
                .build();

        part = sparePartRepository.save(part);
        return DtoMapper.toSparePartResponse(part);
    }

    @Transactional
    public SparePartResponse updatePart(Long id, UpdateSparePartRequest request) {
        SparePart part = sparePartRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Деталь з ID " + id + " не знайдено"));

        part.setName(request.getName().trim());
        part.setCategory(request.getCategory().trim());
        part.setPurchasePrice(request.getPurchasePrice());
        part.setRetailPrice(request.getRetailPrice());
        part.setMinStockLimit(request.getMinStockLimit());

        part = sparePartRepository.save(part);
        return DtoMapper.toSparePartResponse(part);
    }

    @Transactional
    public SparePartResponse updateStock(Long id, Integer additionalQuantity) {
        if (additionalQuantity == null || additionalQuantity == 0) {
            throw new BadRequestException("Кількість зміни залишку не може дорівнювати 0");
        }
        SparePart part = sparePartRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Деталь з ID " + id + " не знайдено"));

        int newStock = part.getStockQuantity() + additionalQuantity;
        if (newStock < 0) {
            throw new BadRequestException("Залишок на складі не може стати від'ємним (поточний залишок: " + part.getStockQuantity() + " шт.)");
        }

        part.setStockQuantity(newStock);
        part = sparePartRepository.save(part);
        return DtoMapper.toSparePartResponse(part);
    }

    @Transactional
    public void deletePart(Long id) {
        if (!sparePartRepository.existsById(id)) {
            throw new ResourceNotFoundException("Деталь з ID " + id + " не знайдено");
        }
        if (orderPartRepository.existsBySparePartId(id)) {
            throw new BadRequestException("Неможливо видалити деталь зі складу, оскільки вона вже фігурує в історії ремонтів");
        }
        sparePartRepository.deleteById(id);
    }
}
