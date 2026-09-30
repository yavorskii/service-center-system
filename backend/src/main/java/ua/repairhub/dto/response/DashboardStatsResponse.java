package ua.repairhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalOrders;
    private long inDiagnosticsCount;
    private long inProgressCount;
    private long readyForPickupCount;
    private long completedCount;
    private BigDecimal totalRevenue;
    private long lowStockPartsCount;
}
