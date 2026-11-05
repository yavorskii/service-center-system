package ua.repairhub.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TwoFactorAuthService {

    private static final int MAX_OTP_ATTEMPTS = 5;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, OtpEntry> otpCache = new ConcurrentHashMap<>();

    public record TwoFactorChallenge(String code, String tempToken) {}

    private record OtpEntry(String code, String tempToken, Instant expiresAt, int attempts) {}

    public TwoFactorChallenge generateChallenge(String username) {
        String code = String.format("%06d", random.nextInt(1000000));
        String tempToken = UUID.randomUUID().toString();
        otpCache.put(username.toLowerCase(), new OtpEntry(code, tempToken, Instant.now().plusSeconds(300), 0));
        return new TwoFactorChallenge(code, tempToken);
    }

    public String generateOtp(String username) {
        return generateChallenge(username).code();
    }

    public boolean verifyOtp(String username, String code, String tempToken) {
        if (username == null || code == null || code.isBlank() || tempToken == null || tempToken.isBlank()) {
            return false;
        }

        String key = username.toLowerCase();
        OtpEntry entry = otpCache.get(key);
        if (entry == null) {
            return false;
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            otpCache.remove(key);
            return false;
        }

        if (!entry.tempToken().equals(tempToken.trim())) {
            return false;
        }

        boolean valid = entry.code().equals(code.trim());
        if (valid) {
            otpCache.remove(key);
            return true;
        }

        int nextAttempts = entry.attempts() + 1;
        if (nextAttempts >= MAX_OTP_ATTEMPTS) {
            otpCache.remove(key);
        } else {
            otpCache.put(key, new OtpEntry(entry.code(), entry.tempToken(), entry.expiresAt(), nextAttempts));
        }
        return false;
    }

    public boolean verifyOtp(String username, String code) {
        if (username == null || code == null || code.isBlank()) {
            return false;
        }

        String key = username.toLowerCase();
        OtpEntry entry = otpCache.get(key);
        if (entry == null) {
            return false;
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            otpCache.remove(key);
            return false;
        }

        boolean valid = entry.code().equals(code.trim());
        if (valid) {
            otpCache.remove(key);
            return true;
        }

        int nextAttempts = entry.attempts() + 1;
        if (nextAttempts >= MAX_OTP_ATTEMPTS) {
            otpCache.remove(key);
        } else {
            otpCache.put(key, new OtpEntry(entry.code(), entry.tempToken(), entry.expiresAt(), nextAttempts));
        }
        return false;
    }

    public void clearOtp(String username) {
        otpCache.remove(username.toLowerCase());
    }
}
