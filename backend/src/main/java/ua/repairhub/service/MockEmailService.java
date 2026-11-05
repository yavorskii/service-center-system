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

import java.nio.charset.StandardCharsets;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class MockEmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final List<MockEmailResponse> mailbox = new CopyOnWriteArrayList<>();

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public void sendActivationEmail(String toEmail, String username, String token) {
        String actionUrl = "/activate?token=" + token;
        String fullUrl = frontendUrl + actionUrl;
        String subject = "Підтвердження електронної пошти — RepairHub";

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
                "Підтвердити електронну пошту",
                fullUrl,
                "Посилання одноразове та дійсне протягом 24 годин. Якщо ви не створювали обліковий запис, просто проігноруйте цей лист."
        );
        dispatchRealEmailAsync(toEmail, subject, html);
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
                "Ми отримали запит на скидання пароля для вашого облікового запису <strong>RepairHub</strong>. Натисніть кнопку нижче, щоб встановити новий надійний пароль:",
                "Встановити новий пароль",
                fullUrl,
                "Одноразове посилання дійсне протягом 15 хвилин. Якщо ви не надсилали цей запит, ваш поточний пароль залишається захищеним."
        );
        dispatchRealEmailAsync(toEmail, subject, html);
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

        dispatchRealEmailAsync(toEmail, subject, html);
    }

    public void sendAccountLockedEmail(String toEmail, String username, String ipAddress) {
        String subject = "Попередження безпеки: акаунт тимчасово заблоковано — RepairHub";

        MockEmailResponse email = MockEmailResponse.builder()
                .id(UUID.randomUUID().toString())
                .toEmail(toEmail)
                .subject(subject)
                .body("Зафіксовано 5 невдалих спроб входу в акаунт " + username + " з IP " + ipAddress + ". Обліковий запис заблоковано на 15 хвилин.")
                .token("")
                .type("SECURITY_ALERT")
                .actionUrl("")
                .createdAt(ZonedDateTime.now())
                .build();

        mailbox.add(0, email);

        String html = buildEmailTemplate(
                "Спрацював захист від підбору пароля",
                "Увага, <strong>" + escapeHtml(username) + "</strong>!",
                "Система безпеки <strong>RepairHub</strong> зафіксувала 5 послідовних невдалих спроб входу до вашого облікового запису (IP-адреса: <code>" + escapeHtml(ipAddress) + "</code>). З метою захисту акаунт тимчасово заблоковано на <strong>15 хвилин</strong>.",
                "Відновити пароль",
                frontendUrl,
                "Якщо це були не ви, рекомендуємо змінити пароль після розблокування або скористатися функцією скидання пароля."
        );
        dispatchRealEmailAsync(toEmail, subject, html);
    }

    public List<MockEmailResponse> getAllEmails() {
        return new ArrayList<>(mailbox);
    }

    public void clear() {
        mailbox.clear();
    }

    private void dispatchRealEmailAsync(String toEmail, String subject, String htmlBody) {
        if (toEmail == null || toEmail.isBlank()) {
            return;
        }
        String recipient = toEmail.trim();
        if (recipient.endsWith("@repairhub.ua") || recipient.endsWith("@example.com")) {
            log.info("Локальний тестовий лист записано в журнал для {}: {}", recipient, subject);
            return;
        }
        if (mailUsername == null || mailUsername.isBlank()) {
            log.warn("MAIL_USERNAME не задано, реальна відправка листа до {} пропущена", recipient);
            return;
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            return;
        }

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
                    <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 24px;">%s</p>
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
