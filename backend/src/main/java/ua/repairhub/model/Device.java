package ua.repairhub.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;

@Entity
@Table(name = "devices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "device_type", nullable = false, length = 50)
    private String deviceType;

    @Column(nullable = false, length = 50)
    private String brand;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(length = 20)
    private String imei;

    @Column(name = "appearance_notes", columnDefinition = "TEXT")
    private String appearanceNotes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}
