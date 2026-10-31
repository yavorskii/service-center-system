package ua.repairhub.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.repairhub.dto.response.DashboardStatsResponse;
import ua.repairhub.model.OrderStatus;
import ua.repairhub.repository.OrderRepository;
import ua.repairhub.repository.SparePartRepository;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private SparePartRepository sparePartRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    @DisplayName("Отримання агрегованої статистики дашборду з прямим підрахунком низького залишку")
    void getStats_Success() {
        when(orderRepository.count()).thenReturn(10L);
        when(orderRepository.countByStatus(OrderStatus.IN_DIAGNOSTICS)).thenReturn(2L);
        when(orderRepository.countByStatus(OrderStatus.IN_PROGRESS)).thenReturn(3L);
        when(orderRepository.countByStatus(OrderStatus.PENDING_APPROVAL)).thenReturn(1L);
        when(orderRepository.countByStatus(OrderStatus.READY_FOR_PICKUP)).thenReturn(2L);
        when(orderRepository.countByStatus(OrderStatus.COMPLETED)).thenReturn(2L);
        when(orderRepository.calculateTotalRevenue()).thenReturn(BigDecimal.valueOf(15000));
        when(sparePartRepository.countLowStockParts()).thenReturn(4L);

        DashboardStatsResponse stats = dashboardService.getStats();

        assertNotNull(stats);
        assertEquals(10L, stats.getTotalOrders());
        assertEquals(2L, stats.getInDiagnosticsCount());
        assertEquals(4L, stats.getInProgressCount());
        assertEquals(2L, stats.getReadyForPickupCount());
        assertEquals(2L, stats.getCompletedCount());
        assertEquals(BigDecimal.valueOf(15000), stats.getTotalRevenue());
        assertEquals(4L, stats.getLowStockPartsCount());

        verify(sparePartRepository, times(1)).countLowStockParts();
        verify(sparePartRepository, never()).findAll();
    }
}
