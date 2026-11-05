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

    private record OtpEntry(String code, String tempToken, String method, Instant expiresAt, int attempts) {}

    public TwoFactorChallenge generateChallenge(String username) {
        String code = String.format("%06d", random.nextInt(1000000));
        String tempToken = UUID.randomUUID().toString();
        otpCache.put(username.toLowerCase(), new OtpEntry(code, tempToken, "EMAIL", Instant.now().plusSeconds(300), 0));
        return new TwoFactorChallenge(code, tempToken);
    }

    public String generateTotpChallengeToken(String username) {
        String tempToken = UUID.randomUUID().toString();
        otpCache.put(username.toLowerCase(), new OtpEntry("", tempToken, "TOTP", Instant.now().plusSeconds(300), 0));
        return tempToken;
    }

    public boolean validateChallengeToken(String username, String tempToken) {
        if (username == null || tempToken == null || tempToken.isBlank()) {
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
        return entry.tempToken().equals(tempToken.trim());
    }

    public boolean recordFailedChallengeAttempt(String username) {
        String key = username.toLowerCase();
        OtpEntry entry = otpCache.get(key);
        if (entry == null) {
            return false;
        }
        int nextAttempts = entry.attempts() + 1;
        if (nextAttempts >= MAX_OTP_ATTEMPTS) {
            otpCache.remove(key);
            return true;
        }
        otpCache.put(key, new OtpEntry(entry.code(), entry.tempToken(), entry.method(), entry.expiresAt(), nextAttempts));
        return false;
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

        boolean valid = !entry.code().isEmpty() && entry.code().equals(code.trim());
        if (valid) {
            otpCache.remove(key);
            return true;
        }

        recordFailedChallengeAttempt(username);
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

        boolean valid = !entry.code().isEmpty() && entry.code().equals(code.trim());
        if (valid) {
            otpCache.remove(key);
            return true;
        }

        recordFailedChallengeAttempt(username);
        return false;
    }

    public void clearOtp(String username) {
        if (username != null) {
            otpCache.remove(username.toLowerCase());
        }
    }
}
