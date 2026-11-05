package ua.repairhub.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.repairhub.dto.request.*;
import ua.repairhub.dto.response.*;
import ua.repairhub.exception.AccountLockedException;
import ua.repairhub.exception.BadRequestException;
import ua.repairhub.exception.DuplicateResourceException;
import ua.repairhub.exception.ResourceNotFoundException;
import ua.repairhub.model.LoginAudit;
import ua.repairhub.model.Role;
import ua.repairhub.model.User;
import ua.repairhub.repository.LoginAuditRepository;
import ua.repairhub.repository.UserRepository;
import ua.repairhub.security.JwtService;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final LoginAuditRepository auditRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final CaptchaService captchaService;
    private final TwoFactorAuthService twoFactorAuthService;
    private final MockEmailService mockEmailService;
    private final GoogleOAuthService googleOAuthService;

    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String ip = extractClientIp(httpRequest);
        String identifier = request.getUsername().trim();

        User user = findUserByIdentifier(identifier);

        if (user == null) {
            logAudit(identifier, ip, "FAILED_BAD_USERNAME", "Користувача не знайдено");
            throw new BadCredentialsException("Невірний логін/email або пароль");
        }

        String username = user.getUsername();

        if (Boolean.FALSE.equals(user.getIsActive())) {
            logAudit(username, ip, "ACCOUNT_LOCKED", "Спроба входу в деактивований акаунт");
            throw new AccountLockedException("Обліковий запис деактивовано адміністратором");
        }

        if (Boolean.TRUE.equals(user.getIsLocked())) {
            if (user.getLockedUntil() != null && ZonedDateTime.now().isAfter(user.getLockedUntil())) {
                user.setIsLocked(false);
                user.setLockedUntil(null);
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            } else {
                logAudit(username, ip, "ACCOUNT_LOCKED", "Спроба входу в заблокований акаунт");
                throw new AccountLockedException("Обліковий запис заблоковано через багаторазові невдалі спроби входу або адміністратором");
            }
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int attempts = (user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0) + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= 5) {
                user.setIsLocked(true);
                user.setLockedUntil(ZonedDateTime.now().plusMinutes(15));
                userRepository.save(user);
                logAudit(username, ip, "ACCOUNT_LOCKED", "Акаунт заблоковано на 15 хв після 5 невдалих спроб");
                if (user.getEmail() != null && !user.getEmail().isBlank()) {
                    mockEmailService.sendAccountLockedEmail(user.getEmail(), username, ip);
                }
                throw new AccountLockedException("Обліковий запис тимчасово заблоковано на 15 хв через 5 невдалих спроб входу!");
            }

            userRepository.save(user);
            logAudit(username, ip, "FAILED_BAD_PASSWORD", "Невдала спроба " + attempts + " з 5");
            throw new BadCredentialsException("Невірний логін/email або пароль. Залишилося спроб: " + (5 - attempts));
        }

        if (Boolean.FALSE.equals(user.getEmailVerified()) && user.getRole() == Role.ROLE_USER) {
            logAudit(username, ip, "ACTIVATION_REQUIRED", "Акаунт очікує підтвердження email");
            throw new BadRequestException("Обліковий запис ще не активовано. Перевірте вашу електронну пошту та перейдіть за посиланням у листі підтвердження");
        }

        if (Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            if (request.getTwoFactorCode() == null || request.getTwoFactorCode().isBlank()) {
                TwoFactorAuthService.TwoFactorChallenge challenge = twoFactorAuthService.generateChallenge(username);
                mockEmailService.sendTwoFactorOtpEmail(
                        user.getEmail() != null ? user.getEmail() : "user@repairhub.ua",
                        username,
                        challenge.code()
                );
                logAudit(username, ip, "TWO_FACTOR_REQUIRED", "Надіслано 6-значний OTP код 2FA на пошту");
                return AuthResponse.builder()
                        .username(username)
                        .fullName(user.getFullName())
                        .role(user.getRole())
                        .email(user.getEmail())
                        .requiresTwoFactor(true)
                        .tempToken(challenge.tempToken())
                        .message("На вашу електронну пошту надіслано 6-значний код підтвердження")
                        .build();
            }

            boolean isOtpValid = twoFactorAuthService.verifyOtp(username, request.getTwoFactorCode());
            if (!isOtpValid) {
                logAudit(username, ip, "FAILED_BAD_2FA", "Невірний код 2FA");
                throw new BadRequestException("Невірний або прострочений код 2FA");
            }
        }

        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        user.setLockedUntil(null);
        userRepository.save(user);

        logAudit(username, ip, "SUCCESS", "Успішний вхід у систему");
        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .username(username)
                .fullName(user.getFullName())
                .role(user.getRole())
                .email(user.getEmail())
                .emailVerified(user.getEmailVerified())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .requiresTwoFactor(false)
                .build();
    }

    public AuthResponse verifyTwoFactor(TwoFactorVerifyRequest request, HttpServletRequest httpRequest) {
        String ip = extractClientIp(httpRequest);
        User user = findUserByIdentifier(request.getUsername());
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }
        String username = user.getUsername();

        if (Boolean.TRUE.equals(user.getIsLocked()) && (user.getLockedUntil() == null || ZonedDateTime.now().isBefore(user.getLockedUntil()))) {
            logAudit(username, ip, "ACCOUNT_LOCKED", "Спроба 2FA в заблокований акаунт");
            throw new AccountLockedException("Обліковий запис заблоковано");
        }

        boolean isOtpValid = twoFactorAuthService.verifyOtp(username, request.getCode(), request.getTempToken());
        if (!isOtpValid) {
            logAudit(username, ip, "FAILED_BAD_2FA", "Невірний або прострочений код 2FA");
            throw new BadRequestException("Невірний або прострочений код 2FA");
        }

        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        user.setLockedUntil(null);
        userRepository.save(user);

        logAudit(username, ip, "SUCCESS", "Успішна автентифікація через 2FA");
        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .username(username)
                .fullName(user.getFullName())
                .role(user.getRole())
                .email(user.getEmail())
                .emailVerified(user.getEmailVerified())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .requiresTwoFactor(false)
                .build();
    }

    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        String ip = extractClientIp(httpRequest);
        String username = request.getUsername().trim();

        if (request.getCaptchaToken() == null || request.getCaptchaToken().isBlank()
                || !captchaService.validate(request.getCaptchaToken(), request.getCaptchaAnswer())) {
            logAudit(username, ip, "FAILED_CAPTCHA", "Невірний або відсутній код CAPTCHA");
            throw new BadRequestException("Невірний або застарілий код CAPTCHA. Спробуйте ще раз");
        }

        passwordPolicyValidator.validate(request.getPassword());

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new DuplicateResourceException("Користувач із логіном '" + username + "' вже зареєстрований");
        }

        String email = request.getEmail() != null && !request.getEmail().isBlank()
                ? request.getEmail().trim().toLowerCase()
                : username.toLowerCase() + "@repairhub.ua";

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("Користувач із електронною поштою '" + email + "' вже зареєстрований");
        }

        String activationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .email(email)
                .phone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null)
                .role(Role.ROLE_USER)
                .isActive(true)
                .emailVerified(false)
                .activationToken(activationToken)
                .activationExpiresAt(ZonedDateTime.now().plusHours(24))
                .failedLoginAttempts(0)
                .isLocked(false)
                .twoFactorEnabled(false)
                .authProvider("LOCAL")
                .build();

        user = userRepository.save(user);
        mockEmailService.sendActivationEmail(email, user.getUsername(), activationToken);
        logAudit(user.getUsername(), ip, "REGISTERED", "Реєстрація успішна, надіслано лист активації на " + email);

        return AuthResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .email(user.getEmail())
                .emailVerified(false)
                .twoFactorEnabled(false)
                .message("Реєстрація успішна! На адресу " + email + " надіслано лист для підтвердження")
                .build();
    }

    @Transactional
    public String activateAccount(ActivateAccountRequest request) {
        User user = userRepository.findByActivationToken(request.getToken().trim())
                .orElseThrow(() -> new BadRequestException("Недійсне або вже використане посилання активації"));

        if (user.getActivationExpiresAt() != null && ZonedDateTime.now().isAfter(user.getActivationExpiresAt())) {
            throw new BadRequestException("Термін дії посилання активації минув (24 години)");
        }

        user.setEmailVerified(true);
        user.setActivationToken(null);
        user.setActivationExpiresAt(null);
        userRepository.save(user);

        logAudit(user.getUsername(), "email-link", "ACTIVATED", "Електронну пошту успішно підтверджено");
        return "Електронну пошту успішно підтверджено! Тепер ви можете увійти у свій акаунт.";
    }

    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Обліковий запис із вказаною електронною поштою не знайдено"));

        String resetToken = UUID.randomUUID().toString();
        user.setPasswordResetToken(resetToken);
        user.setPasswordResetExpiresAt(ZonedDateTime.now().plusMinutes(15));
        userRepository.save(user);

        mockEmailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), resetToken);
        logAudit(user.getUsername(), "email-reset", "PASSWORD_RESET_REQUESTED", "Надіслано лист для відновлення пароля");

        return "Лист із посиланням для скидання пароля надіслано на " + user.getEmail();
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByPasswordResetToken(request.getToken().trim())
                .orElseThrow(() -> new BadRequestException("Недійсне або вже використане посилання відновлення пароля"));

        if (user.getPasswordResetExpiresAt() != null && ZonedDateTime.now().isAfter(user.getPasswordResetExpiresAt())) {
            throw new BadRequestException("Термін дії посилання для відновлення пароля минув (15 хвилин)");
        }

        passwordPolicyValidator.validate(request.getNewPassword());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        user.setLockedUntil(null);
        userRepository.save(user);

        logAudit(user.getUsername(), "email-reset", "PASSWORD_RESET_SUCCESS", "Пароль успішно змінено");
        return "Новий пароль збережено! Тепер ви можете увійти до облікового запису.";
    }

    public String getGoogleAuthorizationUrl(String redirectUri) {
        return googleOAuthService.buildAuthorizationUrl(redirectUri);
    }

    @Transactional
    public AuthResponse authenticateWithGoogleCode(GoogleCodeRequest request, HttpServletRequest httpRequest) {
        GoogleOAuthService.GoogleUserInfo googleUser = googleOAuthService.exchangeCodeForUser(
                request.getCode(),
                request.getRedirectUri()
        );
        return completeOAuthAuthentication("GOOGLE", googleUser.email(), googleUser.fullName(), httpRequest);
    }

    @Transactional
    public AuthResponse oauthLogin(OAuthLoginRequest request, HttpServletRequest httpRequest) {
        return completeOAuthAuthentication(
                request.getProvider().toUpperCase(),
                request.getEmail().trim().toLowerCase(),
                request.getFullName().trim(),
                httpRequest
        );
    }

    private AuthResponse completeOAuthAuthentication(String provider, String email, String fullName, HttpServletRequest httpRequest) {
        String ip = extractClientIp(httpRequest);
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (user == null) {
            String baseUsername = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_");
            if (baseUsername.length() < 3) {
                baseUsername = "user_" + baseUsername;
            }
            String username = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsernameIgnoreCase(username)) {
                username = baseUsername + counter++;
            }

            user = User.builder()
                    .username(username)
                    .fullName(fullName)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.ROLE_USER)
                    .authProvider(provider)
                    .emailVerified(true)
                    .isActive(true)
                    .failedLoginAttempts(0)
                    .isLocked(false)
                    .twoFactorEnabled(false)
                    .build();

            user = userRepository.save(user);
            logAudit(user.getUsername(), ip, "OAUTH_REGISTER", "Реєстрація через " + provider + " (" + email + ")");
        } else {
            if (Boolean.FALSE.equals(user.getIsActive())) {
                logAudit(user.getUsername(), ip, "OAUTH_BLOCKED", "Спроба OAuth входу в деактивований акаунт");
                throw new AccountLockedException("Обліковий запис деактивовано адміністратором");
            }
            if (Boolean.TRUE.equals(user.getIsLocked())) {
                if (user.getLockedUntil() != null && ZonedDateTime.now().isAfter(user.getLockedUntil())) {
                    user.setIsLocked(false);
                    user.setLockedUntil(null);
                    user.setFailedLoginAttempts(0);
                } else {
                    logAudit(user.getUsername(), ip, "OAUTH_BLOCKED", "Спроба OAuth входу в заблокований акаунт");
                    throw new AccountLockedException("Обліковий запис заблоковано");
                }
            }
            user.setEmailVerified(true);
            user.setActivationToken(null);
            user.setActivationExpiresAt(null);
            user.setFailedLoginAttempts(0);
            if ("LOCAL".equalsIgnoreCase(user.getAuthProvider()) && "GOOGLE".equalsIgnoreCase(provider)) {
                user.setAuthProvider("LOCAL+GOOGLE");
            }
            user = userRepository.save(user);
            logAudit(user.getUsername(), ip, "OAUTH_LOGIN", "Успішний вхід через " + provider + " (" + email + ")");
        }

        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .email(user.getEmail())
                .emailVerified(user.getEmailVerified())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .build();
    }

    @Transactional
    public UserSecurityProfileResponse toggleTwoFactor(String username, Boolean enabled) {
        User user = findUserByIdentifier(username);
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }

        user.setTwoFactorEnabled(Boolean.TRUE.equals(enabled));
        userRepository.save(user);
        logAudit(user.getUsername(), "profile", "2FA_TOGGLED", "2FA статус змінено на: " + enabled);

        return mapToProfile(user);
    }

    public UserSecurityProfileResponse getUserProfile(String username) {
        User user = findUserByIdentifier(username);
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }
        return mapToProfile(user);
    }

    public List<SecurityAuditResponse> getAuditLogs() {
        return auditRepository.findTop100ByOrderByAttemptTimeDesc().stream()
                .map(a -> SecurityAuditResponse.builder()
                        .id(a.getId())
                        .username(a.getUsername())
                        .ipAddress(a.getIpAddress())
                        .attemptTime(a.getAttemptTime())
                        .status(a.getStatus())
                        .details(a.getDetails())
                        .build())
                .toList();
    }

    @Transactional
    public void lockUser(Long userId, String adminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено"));
        if (adminUsername != null && user.getUsername().equalsIgnoreCase(adminUsername)) {
            throw new BadRequestException("Неможливо заблокувати власний обліковий запис адміністратора");
        }
        user.setIsLocked(true);
        user.setLockedUntil(ZonedDateTime.now().plusYears(10));
        userRepository.save(user);
        logAudit(user.getUsername(), "admin:" + (adminUsername != null ? adminUsername : "system"), "BLOCKED_BY_ADMIN", "Адміністратор заблокував акаунт");
    }

    @Transactional
    public void lockUser(Long userId) {
        lockUser(userId, null);
    }

    @Transactional
    public void unlockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено"));
        user.setIsLocked(false);
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
        logAudit(user.getUsername(), "admin", "UNBLOCKED_BY_ADMIN", "Адміністратор розблокував акаунт");
    }

    private User findUserByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return null;
        }
        String trimmed = identifier.trim();
        return userRepository.findByUsernameIgnoreCase(trimmed)
                .or(() -> userRepository.findByEmailIgnoreCase(trimmed))
                .orElse(null);
    }

    private void logAudit(String username, String ip, String status, String details) {
        try {
            LoginAudit audit = LoginAudit.builder()
                    .username(username != null ? username : "unknown")
                    .ipAddress(ip != null ? ip : "127.0.0.1")
                    .status(status)
                    .details(details)
                    .build();
            auditRepository.save(audit);
        } catch (Exception ignored) {
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }

    private UserSecurityProfileResponse mapToProfile(User user) {
        return UserSecurityProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .emailVerified(user.getEmailVerified())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .isLocked(user.getIsLocked())
                .failedLoginAttempts(user.getFailedLoginAttempts())
                .authProvider(user.getAuthProvider())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
