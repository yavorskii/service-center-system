package ua.repairhub.service;

import jakarta.servlet.http.HttpServletRequest;

public final class ClientMetadataUtil {

    private ClientMetadataUtil() {
    }

    public static String extractClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }
        String rawIp = null;
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            rawIp = forwarded.split(",")[0].trim();
        }
        if (rawIp == null || rawIp.isBlank()) {
            String realIp = request.getHeader("X-Real-IP");
            if (realIp != null && !realIp.isBlank()) {
                rawIp = realIp.trim();
            }
        }
        if (rawIp == null || rawIp.isBlank()) {
            rawIp = request.getRemoteAddr();
        }
        if (rawIp == null || rawIp.isBlank()) {
            return "127.0.0.1";
        }
        if ("0:0:0:0:0:0:0:1".equals(rawIp) || "::1".equals(rawIp)) {
            return "127.0.0.1";
        }
        String host = request.getHeader("Host");
        boolean isLocalHostHeader = host != null && (host.startsWith("localhost") || host.startsWith("127.0.0.1"));
        if (isLocalHostHeader && rawIp.matches("^172\\.(1[6-9]|2[0-9]|3[0-1])\\.\\d+\\.1$")) {
            return "127.0.0.1";
        }
        return rawIp;
    }

    public static String extractRawUserAgent(HttpServletRequest request) {
        if (request == null) {
            return "Web Client";
        }
        String ua = request.getHeader("User-Agent");
        if (ua == null || ua.isBlank()) {
            return "Web Client";
        }
        return ua.length() > 250 ? ua.substring(0, 250) : ua;
    }

    public static String describeDevice(HttpServletRequest request) {
        if (request == null) {
            return "Web • Local";
        }
        String ua = request.getHeader("User-Agent");
        if (ua == null || ua.isBlank()) {
            return "API Client • Local";
        }

        String browser = "Браузер";
        if (ua.contains("Edg/")) {
            browser = "Edge";
        } else if (ua.contains("OPR/") || ua.contains("Opera")) {
            browser = "Opera";
        } else if (ua.contains("Firefox/")) {
            browser = "Firefox";
        } else if (ua.contains("Chrome/") && !ua.contains("Chromium")) {
            browser = "Chrome";
        } else if (ua.contains("Chromium/")) {
            browser = "Chromium";
        } else if (ua.contains("Safari/") && !ua.contains("Chrome/")) {
            browser = "Safari";
        } else if (ua.toLowerCase().contains("curl/")) {
            browser = "cURL";
        } else if (ua.contains("Python") || ua.contains("Java")) {
            browser = "HTTP Client";
        }

        String os = "OS";
        if (ua.contains("Windows")) {
            os = "Windows";
        } else if (ua.contains("Android")) {
            os = "Android";
        } else if (ua.contains("iPhone") || ua.contains("iPad") || ua.contains("iOS")) {
            os = "iOS";
        } else if (ua.contains("Mac OS X") || ua.contains("Macintosh")) {
            os = "macOS";
        } else if (ua.contains("Linux")) {
            os = "Linux";
        } else {
            os = "Local";
        }

        return browser + " • " + os;
    }
}
