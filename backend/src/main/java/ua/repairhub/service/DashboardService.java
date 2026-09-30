package ua.repairhub.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.repairhub.dto.response.DashboardStatsResponse;
import ua.repairhub.model.OrderStatus;
import ua.repairhub.repository.OrderRepository;
import ua.repairhub.repository.SparePartRepository;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final SparePartRepository sparePartRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        long totalOrders = orderRepository.count();
        long inDiag = orderRepository.countByStatus(OrderStatus.IN_DIAGNOSTICS);
        long inProg = orderRepository.countByStatus(OrderStatus.IN_PROGRESS) +
                orderRepository.countByStatus(OrderStatus.PENDING_APPROVAL);
        long ready = orderRepository.countByStatus(OrderStatus.READY_FOR_PICKUP);
        long completed = orderRepository.countByStatus(OrderStatus.COMPLETED);
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();

        long lowStockCount = sparePartRepository.findAll().stream()
                .filter(p -> p.getStockQuantity() <= p.getMinStockLimit())
                .count();

        return DashboardStatsResponse.builder()
                .totalOrders(totalOrders)
                .inDiagnosticsCount(inDiag)
                .inProgressCount(inProg)
                .readyForPickupCount(ready)
                .completedCount(completed)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .lowStockPartsCount(lowStockCount)
                .build();
    }
}
