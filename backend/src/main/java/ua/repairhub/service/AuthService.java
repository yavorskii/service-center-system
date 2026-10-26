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

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String ip = extractClientIp(httpRequest);
        String username = request.getUsername().trim();

        User user = userRepository.findByUsername(username)
                .orElse(null);

        if (user == null) {
            logAudit(username, ip, "FAILED_BAD_USERNAME", "Користувача не знайдено");
            throw new BadCredentialsException("Невірне ім'я користувача або пароль");
        }

        if (Boolean.TRUE.equals(user.getIsLocked())) {
            if (user.getLockedUntil() != null && ZonedDateTime.now().isAfter(user.getLockedUntil())) {
                user.setIsLocked(false);
                user.setLockedUntil(null);
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            } else {
                logAudit(username, ip, "ACCOUNT_LOCKED", "Спроба входу в заблокований акаунт");
                throw new AccountLockedException("Обліковий запис заблоковано через багаторазові невдалі спроби входу");
            }
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int attempts = (user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0) + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= 5) {
                user.setIsLocked(true);
                user.setLockedUntil(ZonedDateTime.now().plusMinutes(15));
                userRepository.save(user);
                logAudit(username, ip, "ACCOUNT_LOCKED", "Акаунт заблоковано після 5 невдалих спроб");
                throw new AccountLockedException("Обліковий запис тимчасово заблоковано на 15 хв через 5 невдалих спроб входу!");
            }

            userRepository.save(user);
            logAudit(username, ip, "FAILED_BAD_PASSWORD", "Невдала спроба " + attempts + " з 5");
            throw new BadCredentialsException("Невірне ім'я користувача або пароль. Залишилося спроб: " + (5 - attempts));
        }

        if (Boolean.FALSE.equals(user.getEmailVerified()) && user.getRole() == Role.ROLE_USER) {
            logAudit(username, ip, "ACTIVATION_REQUIRED", "Акаунт очікує підтвердження email");
            throw new BadRequestException("Обліковий запис не активовано. Будь ласка, підтвердіть вашу електронну пошту");
        }

        if (Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            if (request.getTwoFactorCode() == null || request.getTwoFactorCode().isBlank()) {
                String code = twoFactorAuthService.generateOtp(user.getUsername());
                mockEmailService.sendTwoFactorOtpEmail(
                        user.getEmail() != null ? user.getEmail() : "user@repairhub.ua",
                        user.getUsername(),
                        code
                );
                logAudit(username, ip, "TWO_FACTOR_REQUIRED", "Надіслано 2FA OTP код");
                return AuthResponse.builder()
                        .username(user.getUsername())
                        .requiresTwoFactor(true)
                        .message("Надіслано 6-значний код 2FA. Введіть його для завершення входу")
                        .build();
            }

            boolean isOtpValid = twoFactorAuthService.verifyOtp(user.getUsername(), request.getTwoFactorCode());
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
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .emailVerified(user.getEmailVerified())
                .requiresTwoFactor(false)
                .build();
    }

    public AuthResponse verifyTwoFactor(TwoFactorVerifyRequest request, HttpServletRequest httpRequest) {
        String ip = extractClientIp(httpRequest);
        String username = request.getUsername().trim();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено"));

        boolean isOtpValid = twoFactorAuthService.verifyOtp(username, request.getCode());
        if (!isOtpValid) {
            logAudit(username, ip, "FAILED_BAD_2FA", "Невірний код 2FA");
            throw new BadRequestException("Невірний або прострочений код 2FA");
        }

        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        userRepository.save(user);

        logAudit(username, ip, "SUCCESS", "Успішна автентифікація через 2FA");
        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .emailVerified(user.getEmailVerified())
                .requiresTwoFactor(false)
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        String ip = extractClientIp(httpRequest);

        if (request.getCaptchaToken() != null && !request.getCaptchaToken().isBlank()) {
            boolean isCaptchaValid = captchaService.validate(request.getCaptchaToken(), request.getCaptchaAnswer());
            if (!isCaptchaValid) {
                logAudit(request.getUsername(), ip, "FAILED_CAPTCHA", "Невірний код CAPTCHA");
                throw new BadRequestException("Невірний або застарілий код CAPTCHA. Спробуйте ще раз");
            }
        }

        passwordPolicyValidator.validate(request.getPassword());

        if (userRepository.existsByUsername(request.getUsername().trim())) {
            throw new DuplicateResourceException("Користувач із логіном '" + request.getUsername() + "' вже зареєстрований");
        }

        String email = request.getEmail() != null && !request.getEmail().isBlank()
                ? request.getEmail().trim()
                : request.getUsername().trim() + "@repairhub.ua";

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Користувач із email '" + email + "' вже зареєстрований");
        }

        String activationToken = UUID.randomUUID().toString();
        Role role = request.getRole() != null ? request.getRole() : Role.ROLE_USER;

        User user = User.builder()
                .username(request.getUsername().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .email(email)
                .phone(request.getPhone())
                .role(role)
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
        logAudit(user.getUsername(), ip, "REGISTERED", "Реєстрація успішна, надіслано лист активації");

        return AuthResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .emailVerified(false)
                .message("Реєстрація успішна! Лист із посиланням для активації надіслано на вашу електронну пошту")
                .build();
    }

    @Transactional
    public String activateAccount(ActivateAccountRequest request) {
        User user = userRepository.findByActivationToken(request.getToken().trim())
                .orElseThrow(() -> new BadRequestException("Недійсний токен активації облікового запису"));

        if (user.getActivationExpiresAt() != null && ZonedDateTime.now().isAfter(user.getActivationExpiresAt())) {
            throw new BadRequestException("Термін дії токена активації минув. Запросіть нове посилання");
        }

        user.setEmailVerified(true);
        user.setActivationToken(null);
        user.setActivationExpiresAt(null);
        userRepository.save(user);

        logAudit(user.getUsername(), "system", "ACTIVATED", "Обліковий запис успішно активовано");
        return "Обліковий запис успішно активовано! Тепер ви можете увійти до системи.";
    }

    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Користувача з вказаною поштою не знайдено"));

        String resetToken = UUID.randomUUID().toString();
        user.setPasswordResetToken(resetToken);
        user.setPasswordResetExpiresAt(ZonedDateTime.now().plusMinutes(15));
        userRepository.save(user);

        mockEmailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), resetToken);
        logAudit(user.getUsername(), "system", "PASSWORD_RESET_REQUESTED", "Згенеровано токен скидання пароля");

        return "Лист із посиланням для відновлення пароля надіслано на вашу електронну пошту.";
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByPasswordResetToken(request.getToken().trim())
                .orElseThrow(() -> new BadRequestException("Недійсний або застарілий токен відновлення пароля"));

        if (user.getPasswordResetExpiresAt() != null && ZonedDateTime.now().isAfter(user.getPasswordResetExpiresAt())) {
            throw new BadRequestException("Термін дії посилання для відновлення пароля минув (ліміт 15 хвилин)");
        }

        passwordPolicyValidator.validate(request.getNewPassword());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        user.setLockedUntil(null);
        userRepository.save(user);

        logAudit(user.getUsername(), "system", "PASSWORD_RESET_SUCCESS", "Пароль успішно змінено");
        return "Пароль успішно оновлено! Ви можете увійти з новим паролем.";
    }

    @Transactional
    public AuthResponse oauthLogin(OAuthLoginRequest request, HttpServletRequest httpRequest) {
        String ip = extractClientIp(httpRequest);
        String email = request.getEmail().trim().toLowerCase();
        String provider = request.getProvider().toUpperCase();

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            String baseUsername = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_");
            String username = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsername(username)) {
                username = baseUsername + counter++;
            }

            user = User.builder()
                    .username(username)
                    .fullName(request.getFullName())
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
            logAudit(user.getUsername(), ip, "OAUTH_REGISTER", "Реєстрація через " + provider);
        } else {
            if (Boolean.TRUE.equals(user.getIsLocked())) {
                logAudit(user.getUsername(), ip, "OAUTH_BLOCKED", "Спроба OAuth входу в заблокований акаунт");
                throw new AccountLockedException("Обліковий запис заблоковано адміністратором");
            }
            logAudit(user.getUsername(), ip, "OAUTH_LOGIN", "Успішний вхід через " + provider);
        }

        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .emailVerified(user.getEmailVerified())
                .build();
    }

    @Transactional
    public UserSecurityProfileResponse toggleTwoFactor(String username, Boolean enabled) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено"));

        user.setTwoFactorEnabled(Boolean.TRUE.equals(enabled));
        userRepository.save(user);
        logAudit(username, "profile", "2FA_TOGGLED", "2FA статус змінено на: " + enabled);

        return mapToProfile(user);
    }

    public UserSecurityProfileResponse getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено"));
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
    public void lockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено"));
        user.setIsLocked(true);
        user.setLockedUntil(ZonedDateTime.now().plusYears(10));
        userRepository.save(user);
        logAudit(user.getUsername(), "admin", "BLOCKED_BY_ADMIN", "Адміністратор заблокував акаунт");
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
