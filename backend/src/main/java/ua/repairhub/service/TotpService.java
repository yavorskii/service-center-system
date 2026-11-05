package ua.repairhub.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.EnumMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TotpService {

    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int SECRET_BYTES = 20;
    private static final int TIME_STEP_SECONDS = 30;
    private static final int DIGITS = 6;

    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, Long> usedWindowCache = new ConcurrentHashMap<>();

    public String generateSecret() {
        byte[] buffer = new byte[SECRET_BYTES];
        secureRandom.nextBytes(buffer);
        return encodeBase32(buffer);
    }

    public String buildOtpAuthUrl(String accountLabel, String secret) {
        String issuer = "RepairHub";
        String safeAccount = URLEncoder.encode(accountLabel, StandardCharsets.UTF_8).replace("+", "%20");
        String safeIssuer = URLEncoder.encode(issuer, StandardCharsets.UTF_8);
        return "otpauth://totp/" + safeIssuer + ":" + safeAccount
                + "?secret=" + secret
                + "&issuer=" + safeIssuer
                + "&algorithm=SHA1&digits=6&period=30";
    }

    public String generateQrCodeSvg(String otpAuthUrl) {
        try {
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.MARGIN, 2);
            hints.put(EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name());

            BitMatrix matrix = new QRCodeWriter().encode(otpAuthUrl, BarcodeFormat.QR_CODE, 0, 0, hints);
            int width = matrix.getWidth();
            int height = matrix.getHeight();

            StringBuilder sb = new StringBuilder();
            sb.append("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ")
                    .append(width).append(' ').append(height)
                    .append("\" width=\"188\" height=\"188\" shape-rendering=\"crispEdges\">");
            sb.append("<rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"2\"/>");
            sb.append("<path fill=\"#0f172a\" d=\"");
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    if (matrix.get(x, y)) {
                        sb.append('M').append(x).append(',').append(y).append("h1v1h-1z");
                    }
                }
            }
            sb.append("\"/></svg>");
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Не вдалося згенерувати QR-код TOTP", e);
        }
    }

    public boolean verifyCode(String base32Secret, String code, String replayScope) {
        if (base32Secret == null || base32Secret.isBlank() || code == null) {
            return false;
        }
        String normalizedCode = code.replaceAll("\\s+", "");
        if (!normalizedCode.matches("\\d{6}")) {
            return false;
        }
        byte[] key = decodeBase32(base32Secret);
        if (key.length == 0) {
            return false;
        }

        long currentWindow = Instant.now().getEpochSecond() / TIME_STEP_SECONDS;
        for (long offset = -1; offset <= 1; offset++) {
            long candidateWindow = currentWindow + offset;
            String expected = generateCodeForWindow(key, candidateWindow);
            if (expected.equals(normalizedCode)) {
                if (replayScope != null && !replayScope.isBlank()) {
                    String cacheKey = replayScope.toLowerCase() + ":" + candidateWindow + ":" + normalizedCode;
                    Long prev = usedWindowCache.putIfAbsent(cacheKey, Instant.now().getEpochSecond());
                    if (prev != null) {
                        return false;
                    }
                    cleanupReplayCache();
                }
                return true;
            }
        }
        return false;
    }

    public String getCurrentCode(String base32Secret) {
        byte[] key = decodeBase32(base32Secret);
        long currentWindow = Instant.now().getEpochSecond() / TIME_STEP_SECONDS;
        return generateCodeForWindow(key, currentWindow);
    }

    private void cleanupReplayCache() {
        if (usedWindowCache.size() < 200) {
            return;
        }
        long cutoff = Instant.now().getEpochSecond() - 180;
        usedWindowCache.entrySet().removeIf(entry -> entry.getValue() < cutoff);
    }

    private String generateCodeForWindow(byte[] key, long window) {
        try {
            byte[] data = ByteBuffer.allocate(8).putLong(window).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);

            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            int otp = binary % (int) Math.pow(10, DIGITS);
            return String.format("%0" + DIGITS + "d", otp);
        } catch (Exception e) {
            throw new IllegalStateException("Помилка обчислення коду TOTP", e);
        }
    }

    private String encodeBase32(byte[] data) {
        StringBuilder result = new StringBuilder((data.length * 8 + 4) / 5);
        int buffer = data[0] & 0xFF;
        int next = 1;
        int bitsLeft = 8;
        while (bitsLeft > 0 || next < data.length) {
            if (bitsLeft < 5) {
                if (next < data.length) {
                    buffer <<= 8;
                    buffer |= (data[next++] & 0xFF);
                    bitsLeft += 8;
                } else {
                    int pad = 5 - bitsLeft;
                    buffer <<= pad;
                    bitsLeft += pad;
                }
            }
            int index = 0x1F & (buffer >> (bitsLeft - 5));
            bitsLeft -= 5;
            result.append(BASE32_ALPHABET.charAt(index));
        }
        return result.toString();
    }

    private byte[] decodeBase32(String secret) {
        String clean = secret.trim().replace("=", "").replace(" ", "").toUpperCase();
        byte[] out = new byte[clean.length() * 5 / 8];
        int buffer = 0;
        int bitsLeft = 0;
        int count = 0;
        for (char c : clean.toCharArray()) {
            int val = BASE32_ALPHABET.indexOf(c);
            if (val < 0) {
                continue;
            }
            buffer <<= 5;
            buffer |= val & 0x1F;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                out[count++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xFF);
                bitsLeft -= 8;
            }
        }
        if (count == out.length) {
            return out;
        }
        byte[] trimmed = new byte[count];
        System.arraycopy(out, 0, trimmed, 0, count);
        return trimmed;
    }
}
