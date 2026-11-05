package ua.repairhub.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import ua.repairhub.dto.response.MockEmailResponse;
import ua.repairhub.dto.response.SentEmailLogResponse;
import ua.repairhub.model.SentEmailLog;
import ua.repairhub.repository.SentEmailLogRepository;

import java.nio.charset.StandardCharsets;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class MockEmailService {

    private static final DateTimeFormatter UTC_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss 'UTC'");

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final SentEmailLogRepository sentEmailLogRepository;
    private final List<MockEmailResponse> mailbox = new CopyOnWriteArrayList<>();

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public void sendActivationEmail(String toEmail, String username, String token) {
        String actionUrl = "/activate?token=" + token;
        String fullUrl = frontendUrl + actionUrl;
        String subject = "Активація облікового запису — RepairHub";

        MockEmailResponse email = MockEmailResponse.builder()
                .id(UUID.randomUUID().toString())
                .toEmail(toEmail)
                .subject(subject)
                .body("Вітаємо, " + username + "!\n\nДля підтвердження електронної пошти та активації вашого облікового запису перейдіть за посиланням:\n" + fullUrl + "\n\nПосилання дійсне протягом 24 годин.")
                .token(token)
                .type("ACTIVATION")
                .actionUrl(actionUrl)
                .createdAt(ZonedDateTime.now())
                .build();

        mailbox.add(0, email);

        String html = buildEmailTemplate(
                "Підтвердження облікового запису",
                "Вітаємо, <strong>" + escapeHtml(username) + "</strong>!",
                "Дякуємо за реєстрацію в сервісному центрі <strong>RepairHub</strong>. Щоб активувати ваш обліковий запис та отримати доступ до особистого кабінету, натисніть кнопку нижче:",
                "Активувати обліковий запис",
                fullUrl,
                "Одноразове посилання дійсне протягом 24 годин. Якщо ви не створювали обліковий запис, просто проігноруйте цей лист."
        );
        dispatchEmail(toEmail, username, subject, "ACTIVATION", html);
    }

    public void sendPasswordResetEmail(String toEmail, String username, String token) {
        String actionUrl = "/reset-password?token=" + token;
        String fullUrl = frontendUrl + actionUrl;
        String subject = "Відновлення пароля — RepairHub";

        MockEmailResponse email = MockEmailResponse.builder()
                .id(UUID.randomUUID().toString())
                .toEmail(toEmail)
                .subject(subject)
                .body("Шановний(а) " + username + ",\n\nОтримано запит на скидання пароля. Перейдіть за посиланням нижче, щоб встановити новий пароль:\n" + fullUrl + "\n\nПосилання дійсне 15 хвилин.")
                .token(token)
                .type("PASSWORD_RESET")
                .actionUrl(actionUrl)
                .createdAt(ZonedDateTime.now())
                .build();

        mailbox.add(0, email);

        String html = buildEmailTemplate(
                "Запит на відновлення пароля",
                "Вітаємо, <strong>" + escapeHtml(username) + "</strong>!",
                "Ми отримали запит на скидання пароля для вашого облікового запису <strong>RepairHub</strong>. Натисніть кнопку нижче, щоб встановити новий надійний пароль (після зміни пароля всі попередні сеанси буде автоматично завершено):",
                "Встановити новий пароль",
                fullUrl,
                "Одноразове посилання дійсне протягом 15 хвилин. Якщо ви не надсилали цей запит, ваш поточний пароль залишається захищеним."
        );
        dispatchEmail(toEmail, username, subject, "PASSWORD_RESET", html);
    }

    public void sendTwoFactorOtpEmail(String toEmail, String username, String otpCode) {
        String subject = "Код підтвердження входу (2FA): " + otpCode + " — RepairHub";

        MockEmailResponse email = MockEmailResponse.builder()
                .id(UUID.randomUUID().toString())
                .toEmail(toEmail)
                .subject(subject)
                .body("Ваш одноразовий 6-значний код для підтвердження входу: " + otpCode)
                .token(otpCode)
                .type("TWO_FACTOR_OTP")
                .actionUrl("")
                .createdAt(ZonedDateTime.now())
                .build();

        mailbox.add(0, email);

        String html = """
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; padding: 32px 16px; color: #e2e8f0;">
                  <div style="max-width: 520px; margin: 0 auto; background-color: #111827; border: 1px solid #1e293b; border-radius: 16px; padding: 32px;">
                    <div style="font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 16px;">RepairHub • Безпека входу</div>
                    <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px;">Вітаємо, <strong>%s</strong>! Для завершення входу у ваш обліковий запис введіть цей одноразовий 6-значний код двофакторної автентифікації:</p>
                    <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
                      <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #38bdf8;">%s</span>
                    </div>
                    <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0;">Код дійсний 5 хвилин. Нікому не передавайте цей код.</p>
                  </div>
                </div>
                """.formatted(escapeHtml(username), escapeHtml(otpCode));

        dispatchEmail(toEmail, username, subject, "TWO_FACTOR_OTP", html);
    }

    public void sendAccountLockedEmail(String toEmail, String username, String ipAddress) {
        String subject = "Попередження про спроби входу до RepairHub";
        String supportUrl = frontendUrl + "/support?email=" + escapeHtml(toEmail);
        String utcTime = ZonedDateTime.now(ZoneOffset.UTC).format(UTC_FORMATTER);

        MockEmailResponse email = MockEmailResponse.builder()
                .id(UUID.randomUUID().toString())
                .toEmail(toEmail)
                .subject(subject)
                .body("Зафіксовано 5 невдалих спроб входу в акаунт " + username + " (" + utcTime + ", IP: " + ipAddress + "). Акаунт тимчасово заблоковано на 15 хвилин. Підтримка: " + supportUrl)
                .token("")
                .type("BRUTE_FORCE_ALERT")
                .actionUrl("/support")
                .createdAt(ZonedDateTime.now())
                .build();

        mailbox.add(0, email);

        String detailsText = "Хтось п'ять разів поспіль ввів неправильний пароль до вашого облікового запису. З міркувань безпеки вхід тимчасово обмежено на <strong>15 хвилин</strong>.<br/><br/>"
                + "• <strong>Час інциденту:</strong> <code>" + utcTime + "</code><br/>"
                + "• <strong>IP-адреса з'єднання:</strong> <code>" + escapeHtml(ipAddress) + "</code>";

        String html = buildEmailTemplate(
                "Спрацював захист Brute Force",
                "Увага, <strong>" + escapeHtml(username) + "</strong>!",
                detailsText,
                "Звернутися у службу безпеки",
                supportUrl,
                "Якщо це були не ви, негайно створіть звернення до адміністратора за кнопкою вище, щоб повідомити про підозрілу активність або достроково розблокувати акаунт."
        );
        dispatchEmail(toEmail, username, subject, "BRUTE_FORCE_ALERT", html);
    }

    public void sendSupportReplyEmail(String toEmail, String username, Long ticketId, String ticketSubject, String replyMessage) {
        String subject = "Відповідь служби підтримки RepairHub щодо звернення #" + ticketId;

        MockEmailResponse email = MockEmailResponse.builder()
                .id(UUID.randomUUID().toString())
                .toEmail(toEmail)
                .subject(subject)
                .body(replyMessage)
                .token("")
                .type("SUPPORT_REPLY")
                .actionUrl("")
                .createdAt(ZonedDateTime.now())
                .build();

        mailbox.add(0, email);

        String displayUser = (username != null && !username.isBlank()) ? username : toEmail;
        String mainText = "Адміністратор безпеки розглянув ваше звернення <strong>#" + ticketId + " («" + escapeHtml(ticketSubject) + "»)</strong> та залишив офіційну відповідь:<br/><br/>"
                + "<div style=\"background-color:#0f172a;border-left:3px solid #6366f1;padding:14px 16px;border-radius:8px;color:#f8fafc;\">"
                + escapeHtml(replyMessage).replace("\n", "<br/>")
                + "</div>";

        String html = buildEmailTemplate(
                "Служба безпеки та підтримки",
                "Вітаємо, <strong>" + escapeHtml(displayUser) + "</strong>!",
                mainText,
                "Відкрити RepairHub",
                frontendUrl,
                "Дякуємо за звернення до центру безпеки сервісного центру RepairHub."
        );
        dispatchEmail(toEmail, username, subject, "SUPPORT_REPLY", html);
    }

    public List<MockEmailResponse> getAllEmails() {
        return new ArrayList<>(mailbox);
    }

    public List<SentEmailLogResponse> getSentEmailLogs() {
        return sentEmailLogRepository.findTop200ByOrderBySentAtDesc().stream()
                .map(item -> SentEmailLogResponse.builder()
                        .id(item.getId())
                        .recipientEmail(item.getRecipientEmail())
                        .username(item.getUsername())
                        .subject(item.getSubject())
                        .emailType(item.getEmailType())
                        .deliveryStatus(item.getDeliveryStatus())
                        .sentAt(item.getSentAt())
                        .build())
                .toList();
    }

    public void clear() {
        mailbox.clear();
    }

    private void dispatchEmail(String toEmail, String username, String subject, String emailType, String htmlBody) {
        if (toEmail == null || toEmail.isBlank()) {
            return;
        }
        String recipient = toEmail.trim();
        boolean isLocalTestDomain = recipient.endsWith("@repairhub.ua") || recipient.endsWith("@example.com");
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        boolean canSendSmtp = !isLocalTestDomain && mailUsername != null && !mailUsername.isBlank() && mailSender != null;

        Long logId = null;
        try {
            SentEmailLog saved = sentEmailLogRepository.save(SentEmailLog.builder()
                    .recipientEmail(recipient)
                    .username(username)
                    .subject(subject)
                    .emailType(emailType)
                    .deliveryStatus(canSendSmtp ? "SENT_SMTP" : "LOCAL_LOG")
                    .build());
            logId = saved.getId();
        } catch (Exception ignored) {
        }

        if (!canSendSmtp) {
            log.info("Лист записано в журнал [{}]: {} -> {}", emailType, recipient, subject);
            return;
        }

        final Long targetLogId = logId;
        CompletableFuture.runAsync(() -> {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
                helper.setFrom(new InternetAddress(mailUsername.trim(), "RepairHub Сервісний Центр", StandardCharsets.UTF_8.name()));
                helper.setTo(recipient);
                helper.setSubject(subject);
                helper.setText(htmlBody, true);
                mailSender.send(message);
                log.info("Реальний лист успішно надіслано через SMTP на {}: {}", recipient, subject);
            } catch (Exception e) {
                log.error("Помилка відправки SMTP листа на {}: {}", recipient, e.getMessage());
                if (targetLogId != null) {
                    sentEmailLogRepository.findById(targetLogId).ifPresent(entry -> {
                        entry.setDeliveryStatus("FAILED_SMTP");
                        sentEmailLogRepository.save(entry);
                    });
                }
            }
        });
    }

    private String buildEmailTemplate(String badge, String greeting, String mainText, String buttonLabel, String actionUrl, String footerNote) {
        return """
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; padding: 32px 16px; color: #e2e8f0;">
                  <div style="max-width: 540px; margin: 0 auto; background-color: #111827; border: 1px solid #1e293b; border-radius: 16px; padding: 32px;">
                    <div style="display: inline-block; font-size: 11px; font-weight: 600; color: #818cf8; background-color: rgba(99, 102, 241, 0.14); padding: 4px 10px; border-radius: 999px; margin-bottom: 14px;">%s</div>
                    <div style="font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 14px;">RepairHub</div>
                    <p style="font-size: 15px; color: #f8fafc; margin: 0 0 12px;">%s</p>
                    <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 24px;">%s</div>
                    <div style="margin: 26px 0;">
                      <a href="%s" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 10px;">%s</a>
                    </div>
                    <p style="font-size: 12px; line-height: 1.5; color: #64748b; word-break: break-all; margin: 0 0 16px;">Якщо кнопка не відкривається, скопіюйте посилання у браузер:<br/><a href="%s" style="color: #38bdf8;">%s</a></p>
                    <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;" />
                    <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0;">%s</p>
                  </div>
                </div>
                """.formatted(badge, greeting, mainText, actionUrl, buttonLabel, actionUrl, actionUrl, footerNote);
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
