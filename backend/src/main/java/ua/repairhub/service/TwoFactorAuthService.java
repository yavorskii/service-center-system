package ua.repairhub.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TwoFactorAuthService {

    private final SecureRandom random = new SecureRandom();
    private final Map<String, OtpEntry> otpCache = new ConcurrentHashMap<>();

    private record OtpEntry(String code, Instant expiresAt) {}

    public String generateOtp(String username) {
        String code = String.format("%06d", random.nextInt(1000000));
        otpCache.put(username.toLowerCase(), new OtpEntry(code, Instant.now().plusSeconds(300)));
        return code;
    }

    public boolean verifyOtp(String username, String code) {
        if (username == null || code == null || code.isBlank()) {
            return false;
        }

        OtpEntry entry = otpCache.get(username.toLowerCase());
        if (entry == null) {
            return false;
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            otpCache.remove(username.toLowerCase());
            return false;
        }

        boolean valid = entry.code().equals(code.trim());
        if (valid) {
            otpCache.remove(username.toLowerCase());
        }
        return valid;
    }

    public void clearOtp(String username) {
        otpCache.remove(username.toLowerCase());
    }
}
