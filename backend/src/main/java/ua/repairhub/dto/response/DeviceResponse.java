package ua.repairhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceResponse {
    private Long id;
    private Long clientId;
    private String deviceType;
    private String brand;
    private String model;
    private String serialNumber;
    private String imei;
    private String appearanceNotes;
    private ZonedDateTime createdAt;
}
