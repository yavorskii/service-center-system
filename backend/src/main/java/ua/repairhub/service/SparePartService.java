package ua.repairhub.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.repairhub.dto.request.CreateSparePartRequest;
import ua.repairhub.dto.response.SparePartResponse;
import ua.repairhub.exception.DuplicateResourceException;
import ua.repairhub.exception.ResourceNotFoundException;
import ua.repairhub.model.SparePart;
import ua.repairhub.repository.SparePartRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SparePartService {

    private final SparePartRepository sparePartRepository;

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
        if (sparePartRepository.existsBySku(request.getSku())) {
            throw new DuplicateResourceException("Деталь з артикулом " + request.getSku() + " вже існує на складі");
        }

        SparePart part = SparePart.builder()
                .sku(request.getSku())
                .name(request.getName())
                .category(request.getCategory())
                .purchasePrice(request.getPurchasePrice())
                .retailPrice(request.getRetailPrice())
                .stockQuantity(request.getStockQuantity())
                .minStockLimit(request.getMinStockLimit())
                .build();

        part = sparePartRepository.save(part);
        return DtoMapper.toSparePartResponse(part);
    }

    @Transactional
    public SparePartResponse updateStock(Long id, Integer additionalQuantity) {
        SparePart part = sparePartRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Деталь з ID " + id + " не знайдено"));

        part.setStockQuantity(part.getStockQuantity() + additionalQuantity);
        part = sparePartRepository.save(part);
        return DtoMapper.toSparePartResponse(part);
    }
}
