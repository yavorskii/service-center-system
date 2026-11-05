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

    @Column(name = "actor_username", length = 100)
    private String actorUsername;

    @Column(name = "user_ip_address", length = 60)
    private String userIpAddress;

    @Column(name = "ip_address", nullable = false, length = 60)
    private String ipAddress;

    @Column(name = "user_agent", length = 120)
    private String userAgent;

    @CreationTimestamp
    @Column(name = "attempt_time", updatable = false)
    private ZonedDateTime attemptTime;

    @Column(nullable = false, length = 60)
    private String status;

    @Column(length = 400)
    private String details;
}
