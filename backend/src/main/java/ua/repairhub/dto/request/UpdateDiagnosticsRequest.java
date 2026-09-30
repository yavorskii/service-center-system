package ua.repairhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDiagnosticsRequest {

    @NotBlank(message = "Нотатки діагностики не можуть бути порожніми")
    private String diagnosticsNotes;

    private Long technicianId;
}
