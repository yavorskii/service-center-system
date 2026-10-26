package ua.repairhub.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;

@Entity
@Table(name = "login_audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(name = "ip_address", nullable = false, length = 50)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "attempt_time", updatable = false)
    private ZonedDateTime attemptTime;

    @Column(nullable = false, length = 35)
    private String status;

    @Column(length = 255)
    private String details;
}
