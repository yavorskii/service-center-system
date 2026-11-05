package ua.repairhub.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDiagnosticsRequest {

    @NotBlank(message = "Нотатки діагностики не можуть бути порожніми")
    private String diagnosticsNotes;

    private Long technicianId;

    @DecimalMin(value = "0.0", message = "Орієнтовна вартість не може бути від'ємною")
    private BigDecimal estimatedCost;
}
