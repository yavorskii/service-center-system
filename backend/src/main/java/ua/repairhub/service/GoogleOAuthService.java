package ua.repairhub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ua.repairhub.exception.BadRequestException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleOAuthService {

    private static final String GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

    private final ObjectMapper objectMapper;

    @Value("${app.google.client-id:}")
    private String clientId;

    @Value("${app.google.client-secret:}")
    private String clientSecret;

    @Value("${app.google.redirect-uri:http://localhost:3000/auth/google/callback}")
    private String defaultRedirectUri;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public record GoogleUserInfo(String sub, String email, boolean emailVerified, String fullName) {}

    public String buildAuthorizationUrl(String customRedirectUri) {
        if (clientId == null || clientId.isBlank()) {
            throw new BadRequestException("Google OAuth 2.0 не налаштовано на сервері");
        }
        String redirectUri = resolveRedirectUri(customRedirectUri);
        return GOOGLE_AUTH_ENDPOINT
                + "?client_id=" + encode(clientId.trim())
                + "&redirect_uri=" + encode(redirectUri)
                + "&response_type=code"
                + "&scope=" + encode("openid email profile")
                + "&access_type=online"
                + "&prompt=select_account";
    }

    public GoogleUserInfo exchangeCodeForUser(String code, String customRedirectUri) {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new BadRequestException("Ключі Google OAuth 2.0 не налаштовані на сервері");
        }

        String redirectUri = resolveRedirectUri(customRedirectUri);
        String formBody = "code=" + encode(code.trim())
                + "&client_id=" + encode(clientId.trim())
                + "&client_secret=" + encode(clientSecret.trim())
                + "&redirect_uri=" + encode(redirectUri)
                + "&grant_type=authorization_code";

        try {
            HttpRequest tokenRequest = HttpRequest.newBuilder()
                    .uri(URI.create(GOOGLE_TOKEN_ENDPOINT))
                    .timeout(Duration.ofSeconds(12))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            HttpResponse<String> tokenResponse = httpClient.send(tokenRequest, HttpResponse.BodyHandlers.ofString());
            if (tokenResponse.statusCode() >= 400) {
                log.error("Google token exchange failed ({}): {}", tokenResponse.statusCode(), tokenResponse.body());
                throw new BadRequestException("Не вдалося підтвердити код авторизації Google. Спробуйте увійти ще раз");
            }

            JsonNode tokenJson = objectMapper.readTree(tokenResponse.body());
            String accessToken = tokenJson.path("access_token").asText("");
            if (accessToken.isBlank()) {
                throw new BadRequestException("Google не повернув токен доступу");
            }

            HttpRequest userInfoRequest = HttpRequest.newBuilder()
                    .uri(URI.create(GOOGLE_USERINFO_ENDPOINT))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + accessToken)
                    .GET()
                    .build();

            HttpResponse<String> userInfoResponse = httpClient.send(userInfoRequest, HttpResponse.BodyHandlers.ofString());
            if (userInfoResponse.statusCode() >= 400) {
                log.error("Google userinfo failed ({}): {}", userInfoResponse.statusCode(), userInfoResponse.body());
                throw new BadRequestException("Не вдалося отримати дані профілю Google");
            }

            JsonNode userJson = objectMapper.readTree(userInfoResponse.body());
            String email = userJson.path("email").asText("").trim().toLowerCase();
            if (email.isBlank()) {
                throw new BadRequestException("У вибраному акаунті Google відсутня електронна пошта");
            }

            String sub = userJson.path("sub").asText("");
            boolean verified = userJson.path("email_verified").asBoolean(true);
            String name = userJson.path("name").asText("").trim();
            if (name.isBlank()) {
                name = email.split("@")[0];
            }

            return new GoogleUserInfo(sub, email, verified, name);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Помилка взаємодії з Google OAuth API", e);
            throw new BadRequestException("Помилка з'єднання з сервісом Google OAuth");
        }
    }

    private String resolveRedirectUri(String customRedirectUri) {
        if (customRedirectUri != null && !customRedirectUri.isBlank()) {
            return customRedirectUri.trim();
        }
        return defaultRedirectUri;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
