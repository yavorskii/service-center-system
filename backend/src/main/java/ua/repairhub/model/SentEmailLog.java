package ua.repairhub.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;

@Entity
@Table(name = "sent_email_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SentEmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_email", nullable = false, length = 120)
    private String recipientEmail;

    @Column(length = 100)
    private String username;

    @Column(nullable = false, length = 255)
    private String subject;

    @Column(name = "email_type", nullable = false, length = 50)
    private String emailType;

    @Column(name = "delivery_status", nullable = false, length = 40)
    private String deliveryStatus;

    @CreationTimestamp
    @Column(name = "sent_at", updatable = false)
    private ZonedDateTime sentAt;
}
