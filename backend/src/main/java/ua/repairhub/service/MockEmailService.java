package ua.repairhub.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ua.repairhub.dto.response.MockEmailResponse;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class MockEmailService {

    private final List<MockEmailResponse> mailbox = new CopyOnWriteArrayList<>();

    public void sendActivationEmail(String toEmail, String username, String token) {
        String actionUrl = "/activate?token=" + token;
        MockEmailResponse email = MockEmailResponse.builder()
                .id(UUID.randomUUID().toString())
                .toEmail(toEmail)
                .subject("Активація облікового запису RepairHub")
                .body("Вітаємо, " + username + "! Для підтвердження електронної пошти та активації вашого акаунта перейдіть за посиланням або введіть одноразовий токен.")
                .token(token)
                .type("ACTIVATION")
                .actionUrl(actionUrl)
                .createdAt(ZonedDateTime.now())
                .build();

        mailbox.add(0, email);
        log.info("Email надіслано до {}: Активація з токеном {}", toEmail, token);
    }

    public void sendPasswordResetEmail(String toEmail, String username, String token) {
        String actionUrl = "/reset-password?token=" + token;
        MockEmailResponse email = MockEmailResponse.builder()
                .id(UUID.randomUUID().toString())
                .toEmail(toEmail)
                .subject("Запит на відновлення пароля RepairHub")
                .body("Шановний(а) " + username + ", отримано запит на зміну пароля. Токен дійсний протягом 15 хвилин.")
                .token(token)
                .type("PASSWORD_RESET")
                .actionUrl(actionUrl)
                .createdAt(ZonedDateTime.now())
                .build();

        mailbox.add(0, email);
        log.info("Email надіслано до {}: Скидання пароля з токеном {}", toEmail, token);
    }

    public void sendTwoFactorOtpEmail(String toEmail, String username, String otpCode) {
        MockEmailResponse email = MockEmailResponse.builder()
                .id(UUID.randomUUID().toString())
                .toEmail(toEmail)
                .subject("Код двофакторної автентифікації 2FA")
                .body("Ваш одноразовий 6-значний код для підтвердження входу: " + otpCode)
                .token(otpCode)
                .type("TWO_FACTOR_OTP")
                .actionUrl("")
                .createdAt(ZonedDateTime.now())
                .build();

        mailbox.add(0, email);
        log.info("Email надіслано до {}: 2FA OTP код {}", toEmail, otpCode);
    }

    public List<MockEmailResponse> getAllEmails() {
        return new ArrayList<>(mailbox);
    }

    public void clear() {
        mailbox.clear();
    }
}
