package ua.repairhub.service;

import org.springframework.stereotype.Service;
import ua.repairhub.dto.response.CaptchaResponse;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CaptchaService {

    private static final String CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private final SecureRandom random = new SecureRandom();
    private final Map<String, CaptchaEntry> cache = new ConcurrentHashMap<>();

    private record CaptchaEntry(String code, Instant expiresAt) {}

    public CaptchaResponse generateCaptcha() {
        cleanExpired();
        String token = UUID.randomUUID().toString();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 5; i++) {
            code.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }

        cache.put(token, new CaptchaEntry(code.toString(), Instant.now().plusSeconds(300)));
        String svg = createSvg(code.toString());

        return CaptchaResponse.builder()
                .captchaToken(token)
                .captchaSvg(svg)
                .build();
    }

    public boolean validate(String token, String userInput) {
        if (token == null || userInput == null || userInput.isBlank()) {
            return false;
        }

        CaptchaEntry entry = cache.remove(token);
        if (entry == null) {
            return false;
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            return false;
        }

        return entry.code().equalsIgnoreCase(userInput.trim());
    }

    private String createSvg(String text) {
        StringBuilder sb = new StringBuilder();
        sb.append("<svg xmlns='http://www.w3.org/2000/svg' width='160' height='46' viewBox='0 0 160 46'>");
        sb.append("<rect width='160' height='46' rx='8' fill='#0B0F19' stroke='#334155' stroke-width='1'/>");

        String[] lineColors = {"#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"};
        for (int i = 0; i < 4; i++) {
            int x1 = random.nextInt(20);
            int y1 = random.nextInt(46);
            int x2 = 140 + random.nextInt(20);
            int y2 = random.nextInt(46);
            String col = lineColors[random.nextInt(lineColors.length)];
            sb.append("<line x1='").append(x1).append("' y1='").append(y1)
                    .append("' x2='").append(x2).append("' y2='").append(y2)
                    .append("' stroke='").append(col).append("' stroke-width='1.5' stroke-opacity='0.6'/>");
        }

        for (int i = 0; i < 20; i++) {
            int cx = random.nextInt(160);
            int cy = random.nextInt(46);
            sb.append("<circle cx='").append(cx).append("' cy='").append(cy)
                    .append("' r='1' fill='#64748B' opacity='0.7'/>");
        }

        String[] charColors = {"#60A5FA", "#34D399", "#FBBF24", "#F472B6", "#A78BFA"};
        int startX = 18;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            int rot = -18 + random.nextInt(36);
            int x = startX + (i * 26);
            int y = 31 + (-3 + random.nextInt(6));
            String col = charColors[random.nextInt(charColors.length)];
            sb.append("<text x='").append(x).append("' y='").append(y)
                    .append("' fill='").append(col)
                    .append("' font-size='24' font-weight='bold' font-family='monospace'")
                    .append(" transform='rotate(").append(rot).append(" ").append(x).append(" ").append(y).append(")'>")
                    .append(c).append("</text>");
        }

        sb.append("</svg>");
        return sb.toString();
    }

    private void cleanExpired() {
        Instant now = Instant.now();
        cache.entrySet().removeIf(e -> now.isAfter(e.getValue().expiresAt()));
    }
}
