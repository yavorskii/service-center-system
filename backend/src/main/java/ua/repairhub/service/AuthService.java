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
import ua.repairhub.model.*;
import ua.repairhub.repository.*;
import ua.repairhub.security.JwtService;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final LoginAuditRepository auditRepository;
    private final UserSessionRepository userSessionRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final CaptchaService captchaService;
    private final TwoFactorAuthService twoFactorAuthService;
    private final TotpService totpService;
    private final MockEmailService mockEmailService;
    private final GoogleOAuthService googleOAuthService;

    @Transactional(noRollbackFor = {BadCredentialsException.class, AccountLockedException.class, BadRequestException.class})
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        String identifier = request.getUsername().trim();

        User user = findUserByIdentifier(identifier);
        String targetAccount = user != null ? user.getUsername() : identifier;
        String ownerIp = user != null ? user.getLastLoginIp() : null;

        if (Boolean.TRUE.equals(request.getRequireCaptcha())
                || (request.getCaptchaToken() != null && !request.getCaptchaToken().isBlank())) {
            if (!captchaService.validate(request.getCaptchaToken(), request.getCaptchaAnswer())) {
                logAudit(targetAccount, targetAccount, ownerIp, ip, device, "FAILED_CAPTCHA", "CAPTCHA не підтверджена перед входом");
                throw new BadRequestException("Підтвердіть CAPTCHA перед входом (невірний або порожній код)");
            }
        }

        if (user == null) {
            logAudit(identifier, identifier, null, ip, device, "FAILED_BAD_USERNAME", "Невдала спроба входу: акаунт не знайдено");
            throw new BadCredentialsException("Невірні облікові дані. Після 5 помилок обліковий запис блокується на 15 хвилин.");
        }

        String username = user.getUsername();

        if (Boolean.FALSE.equals(user.getIsActive())) {
            logAudit(username, username, ownerIp, ip, device, "ACCOUNT_LOCKED", "Спроба входу в деактивований акаунт");
            throw new AccountLockedException("Обліковий запис деактивовано адміністратором");
        }

        if (Boolean.TRUE.equals(user.getIsLocked())) {
            if (user.getLockedUntil() != null && ZonedDateTime.now().isAfter(user.getLockedUntil())) {
                user.setIsLocked(false);
                user.setLockedUntil(null);
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            } else {
                logAudit(username, username, ownerIp, ip, device, "ACCOUNT_LOCKED", "Вхід обмежено: обліковий запис перебуває у блокуванні");
                throw new AccountLockedException("Вхід обмежено: обліковий запис заблоковано на 15 хвилин або адміністратором. Спробуйте пізніше або зверніться в підтримку.");
            }
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int attempts = (user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0) + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= 5) {
                user.setIsLocked(true);
                user.setLockedUntil(ZonedDateTime.now().plusMinutes(15));
                userRepository.save(user);
                logAudit(username, username, ownerIp, ip, device, "ACCOUNT_LOCKED", "Тимчасове блокування на 15 хв після 5 невдалих спроб");
                if (user.getEmail() != null && !user.getEmail().isBlank()) {
                    mockEmailService.sendAccountLockedEmail(user.getEmail(), username, ip);
                }
                throw new AccountLockedException("Обліковий запис тимчасово заблоковано на 15 хвилин після 5 невдалих спроб входу! На пошту надіслано попередження безпеки.");
            }

            userRepository.save(user);
            logAudit(username, username, ownerIp, ip, device, "FAILED_BAD_PASSWORD", "Невдала спроба входу (" + attempts + " з 5)");
            throw new BadCredentialsException("Невірні облікові дані. Після 5 помилок обліковий запис блокується на 15 хвилин (залишилося спроб: " + (5 - attempts) + ")");
        }

        if (Boolean.FALSE.equals(user.getEmailVerified()) && user.getRole() == Role.ROLE_USER) {
            logAudit(username, username, ownerIp, ip, device, "ACTIVATION_REQUIRED", "Вхід до активації email відхилено");
            throw new BadRequestException("Потрібна активація: спочатку підтвердіть електронну пошту за посиланням із листа");
        }

        if (Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            if (request.getTwoFactorCode() == null || request.getTwoFactorCode().isBlank()) {
                return buildTwoFactorChallenge(user, httpRequest, "Пароль");
            }
            verifySecondFactorCodeOrThrow(user, request.getTwoFactorCode(), null, httpRequest);
        }

        AuthResponse response = issueAuthenticatedSession(user, httpRequest);
        logAudit(username, username, user.getLastLoginIp(), ip, device, "SUCCESS", "Успішний вхід у систему");
        return response;
    }

    @Transactional(noRollbackFor = {AccountLockedException.class, BadRequestException.class})
    public AuthResponse verifyTwoFactor(TwoFactorVerifyRequest request, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        User user = findUserByIdentifier(request.getUsername());
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }
        String username = user.getUsername();

        if (Boolean.TRUE.equals(user.getIsLocked()) && (user.getLockedUntil() == null || ZonedDateTime.now().isBefore(user.getLockedUntil()))) {
            logAudit(username, username, user.getLastLoginIp(), ip, device, "ACCOUNT_LOCKED", "Спроба підтвердження 2FA в заблокованому акаунті");
            throw new AccountLockedException("Обліковий запис заблоковано");
        }

        verifySecondFactorCodeOrThrow(user, request.getCode(), request.getTempToken(), httpRequest);
        twoFactorAuthService.clearOtp(username);

        AuthResponse response = issueAuthenticatedSession(user, httpRequest);
        logAudit(username, username, user.getLastLoginIp(), ip, device, "SUCCESS_2FA", "Успішний вхід із двофакторним захистом (2FA)");
        return response;
    }

    @Transactional
    public void logout(String jwtToken, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        if (jwtToken == null || jwtToken.isBlank()) {
            return;
        }
        try {
            String username = jwtService.extractUsername(jwtToken);
            String sessionId = jwtService.extractSessionId(jwtToken);
            User user = findUserByIdentifier(username);
            if (sessionId != null && !sessionId.isBlank()) {
                userSessionRepository.findBySessionToken(sessionId).ifPresent(session -> {
                    session.setRevoked(true);
                    session.setRevokedAt(ZonedDateTime.now());
                    userSessionRepository.save(session);
                });
            }
            if (username != null) {
                logAudit(username, username, user != null ? user.getLastLoginIp() : ip, ip, device, "LOGOUT", "Вихід із облікового запису");
            }
        } catch (Exception ignored) {
        }
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        String username = request.getUsername().trim();

        if (request.getCaptchaToken() == null || request.getCaptchaToken().isBlank()
                || !captchaService.validate(request.getCaptchaToken(), request.getCaptchaAnswer())) {
            logAudit(username, username, null, ip, device, "FAILED_CAPTCHA", "CAPTCHA відхилено при реєстрації");
            throw new BadRequestException("CAPTCHA не підтверджена або застаріла. Спробуйте ще раз");
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
                .twoFactorMethod("EMAIL")
                .authProvider("LOCAL")
                .build();

        user = userRepository.save(user);
        mockEmailService.sendActivationEmail(email, user.getUsername(), activationToken);
        logAudit(user.getUsername(), user.getUsername(), null, ip, device, "REGISTERED", "Реєстрація акаунта, надіслано лист активації на " + email);

        return AuthResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .email(user.getEmail())
                .emailVerified(false)
                .twoFactorEnabled(false)
                .authProvider("LOCAL")
                .message("Реєстрація успішна! На адресу " + email + " надіслано лист для підтвердження")
                .build();
    }

    @Transactional
    public String activateAccount(ActivateAccountRequest request, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);

        User user = userRepository.findByActivationToken(request.getToken().trim())
                .orElseThrow(() -> new BadRequestException("Недійсне або вже використане посилання активації"));

        if (user.getActivationExpiresAt() != null && ZonedDateTime.now().isAfter(user.getActivationExpiresAt())) {
            throw new BadRequestException("Термін дії посилання активації минув (24 години)");
        }

        user.setEmailVerified(true);
        user.setActivationToken(null);
        user.setActivationExpiresAt(null);
        userRepository.save(user);

        logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "ACTIVATED", "Активація електронної пошти за одноразовим токеном");
        return "Обліковий запис активовано! Тепер ви можете увійти до системи.";
    }

    @Transactional
    public String activateAccount(ActivateAccountRequest request) {
        return activateAccount(request, null);
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public String forgotPassword(ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        String identifier = request.getEmail().trim();

        User user = findUserByIdentifier(identifier);
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            throw new ResourceNotFoundException("Обліковий запис із вказаною електронною поштою або логіном не знайдено");
        }

        if (Boolean.TRUE.equals(user.getTwoFactorEnabled())
                && "TOTP".equalsIgnoreCase(user.getTwoFactorMethod())
                && user.getTwoFactorSecret() != null) {
            if (request.getTwoFactorCode() == null || request.getTwoFactorCode().isBlank()) {
                logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "PASSWORD_RESET_2FA_REQUIRED", "Запит скидання пароля вимагає підтвердження кодом 2FA");
                throw new BadRequestException("2FA_REQUIRED:На цьому акаунті увімкнено 2FA. Вкажіть актуальний 6-значний код з автентифікатора, щоб надіслати лист.");
            }
            if (!totpService.verifyCode(user.getTwoFactorSecret(), request.getTwoFactorCode(), "reset:" + user.getUsername())) {
                logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "FAILED_BAD_2FA", "Невірний код 2FA під час запиту на відновлення пароля");
                throw new BadRequestException("Невірний або застарілий 6-значний код з автентифікатора (2FA)");
            }
        }

        String resetToken = UUID.randomUUID().toString();
        user.setPasswordResetToken(resetToken);
        user.setPasswordResetExpiresAt(ZonedDateTime.now().plusMinutes(30));
        userRepository.save(user);

        mockEmailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), resetToken);
        logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "PASSWORD_RESET_REQUESTED", "Надіслано лист із токеном відновлення пароля");

        return "Якщо адреса існує, ми надіслали посилання для зміни пароля на " + maskEmail(user.getEmail());
    }

    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        return forgotPassword(request, null);
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public String resetPassword(ResetPasswordRequest request, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);

        User user = userRepository.findByPasswordResetToken(request.getToken().trim())
                .orElseThrow(() -> new BadRequestException("Недійсне або вже використане посилання відновлення пароля"));

        if (Boolean.TRUE.equals(request.getRequireCaptcha())
                || (request.getCaptchaToken() != null && !request.getCaptchaToken().isBlank())) {
            if (!captchaService.validate(request.getCaptchaToken(), request.getCaptchaAnswer())) {
                logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "FAILED_CAPTCHA", "CAPTCHA відхилено під час зміни пароля за токеном");
                throw new BadRequestException("Підтвердіть CAPTCHA для збереження нового пароля");
            }
        }

        if (user.getPasswordResetExpiresAt() != null && ZonedDateTime.now().isAfter(user.getPasswordResetExpiresAt())) {
            throw new BadRequestException("Термін дії посилання для відновлення пароля минув");
        }

        passwordPolicyValidator.validate(request.getNewPassword());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        user.setLockedUntil(null);
        userRepository.save(user);

        int terminated = revokeAllUserSessions(user.getId());
        logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "PASSWORD_RESET_SUCCESS",
                "Пароль змінено за токеном; завершено активних сеансів: " + terminated);
        return "Пароль оновлено. Усі попередні активні сеанси завершено.";
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        return resetPassword(request, null);
    }

    public String getGoogleAuthorizationUrl(String redirectUri) {
        return googleOAuthService.buildAuthorizationUrl(redirectUri);
    }

    @Transactional(noRollbackFor = {AccountLockedException.class, BadRequestException.class})
    public AuthResponse authenticateWithGoogleCode(GoogleCodeRequest request, HttpServletRequest httpRequest) {
        GoogleOAuthService.GoogleUserInfo googleUser = googleOAuthService.exchangeCodeForUser(
                request.getCode(),
                request.getRedirectUri()
        );
        return completeGoogleSignIn(googleUser.email(), googleUser.fullName(), httpRequest, true);
    }

    @Transactional
    public AuthResponse oauthLogin(OAuthLoginRequest request, HttpServletRequest httpRequest) {
        return completeGoogleSignIn(
                request.getEmail().trim().toLowerCase(),
                request.getFullName().trim(),
                httpRequest,
                false
        );
    }

    private AuthResponse completeGoogleSignIn(String email, String fullName, HttpServletRequest httpRequest, boolean enforceExplicitLinkForLocal) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        String normalizedEmail = email.trim().toLowerCase();

        User user = userRepository.findByGoogleEmailIgnoreCase(normalizedEmail)
                .or(() -> userRepository.findByEmailIgnoreCase(normalizedEmail))
                .orElse(null);

        if (user == null) {
            String baseUsername = normalizedEmail.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_");
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
                    .email(normalizedEmail)
                    .googleEmail(normalizedEmail)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.ROLE_USER)
                    .authProvider("GOOGLE")
                    .emailVerified(true)
                    .isActive(true)
                    .failedLoginAttempts(0)
                    .isLocked(false)
                    .twoFactorEnabled(false)
                    .twoFactorMethod("EMAIL")
                    .build();

            user = userRepository.save(user);
            AuthResponse response = issueAuthenticatedSession(user, httpRequest);
            logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "OAUTH_REGISTER", "Реєстрація та вхід через Google OAuth (" + normalizedEmail + ")");
            return response;
        }

        if (Boolean.FALSE.equals(user.getIsActive())) {
            logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "OAUTH_BLOCKED", "Спроба OAuth входу в деактивований акаунт");
            throw new AccountLockedException("Обліковий запис деактивовано адміністратором");
        }

        if (Boolean.TRUE.equals(user.getIsLocked())) {
            if (user.getLockedUntil() != null && ZonedDateTime.now().isAfter(user.getLockedUntil())) {
                user.setIsLocked(false);
                user.setLockedUntil(null);
                user.setFailedLoginAttempts(0);
            } else {
                logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "OAUTH_BLOCKED", "Вхід через Google заблоковано: акаунт обмежений");
                throw new AccountLockedException("Обліковий запис тимчасово заблоковано");
            }
        }

        boolean googleAlreadyConnected = "GOOGLE".equalsIgnoreCase(user.getAuthProvider())
                || "LOCAL+GOOGLE".equalsIgnoreCase(user.getAuthProvider())
                || (user.getGoogleEmail() != null && !user.getGoogleEmail().isBlank());

        if (enforceExplicitLinkForLocal && !googleAlreadyConnected) {
            logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "GOOGLE_LINK_REQUIRED",
                    "Спроба входу через Google без попередньої прив'язки в профілі (" + normalizedEmail + ")");
            throw new BadRequestException("Потрібне підтвердження: ця адреса вже має локальний акаунт RepairHub. Спочатку увійдіть за паролем, відкрийте «Мій профіль» і натисніть «Підключити Google-акаунт».");
        }

        user.setEmailVerified(true);
        user.setActivationToken(null);
        user.setActivationExpiresAt(null);
        user.setFailedLoginAttempts(0);
        if (!googleAlreadyConnected) {
            user.setAuthProvider("LOCAL+GOOGLE");
            user.setGoogleEmail(normalizedEmail);
        }
        user = userRepository.save(user);

        if (Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            return buildTwoFactorChallenge(user, httpRequest, "Google");
        }

        AuthResponse response = issueAuthenticatedSession(user, httpRequest);
        logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "OAUTH_LOGIN", "Успішний вхід через Google OAuth (" + normalizedEmail + ")");
        return response;
    }

    @Transactional
    public UserSecurityProfileResponse linkGoogleAccount(String currentUsername, GoogleCodeRequest request, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);

        User user = findUserByIdentifier(currentUsername);
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }

        GoogleOAuthService.GoogleUserInfo googleUser = googleOAuthService.exchangeCodeForUser(
                request.getCode(),
                request.getRedirectUri()
        );
        String googleEmail = googleUser.email().trim().toLowerCase();

        User existingGoogleOwner = userRepository.findByGoogleEmailIgnoreCase(googleEmail).orElse(null);
        if (existingGoogleOwner != null && !existingGoogleOwner.getId().equals(user.getId())) {
            throw new DuplicateResourceException("Цей Google-акаунт вже підключений до іншого облікового запису");
        }
        User existingEmailOwner = userRepository.findByEmailIgnoreCase(googleEmail).orElse(null);
        if (existingEmailOwner != null && !existingEmailOwner.getId().equals(user.getId())) {
            throw new DuplicateResourceException("Адреса " + googleEmail + " вже використовується іншим обліковим записом");
        }

        user.setGoogleEmail(googleEmail);
        if (!"GOOGLE".equalsIgnoreCase(user.getAuthProvider())) {
            user.setAuthProvider("LOCAL+GOOGLE");
        }
        user.setEmailVerified(true);
        userRepository.save(user);

        logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "GOOGLE_LINKED", "Google-акаунт підключено (" + googleEmail + ")");
        return mapToProfile(user, null);
    }

    @Transactional
    public UserSecurityProfileResponse unlinkGoogleAccount(String currentUsername, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);

        User user = findUserByIdentifier(currentUsername);
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }
        if ("GOOGLE".equalsIgnoreCase(user.getAuthProvider())) {
            throw new BadRequestException("Акаунт створено через Google без пароля. Спочатку встановіть пароль через «Відновлення пароля на email», щоб від'єднати Google.");
        }

        user.setAuthProvider("LOCAL");
        user.setGoogleEmail(null);
        userRepository.save(user);

        logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "GOOGLE_UNLINKED", "Google-акаунт від'єднано від профілю");
        return mapToProfile(user, null);
    }

    public TotpSetupResponse setupTotp(String username, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        User user = findUserByIdentifier(username);
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }
        String secret = totpService.generateSecret();
        String accountLabel = user.getEmail() != null && !user.getEmail().isBlank() ? user.getEmail() : user.getUsername();
        String otpAuthUrl = totpService.buildOtpAuthUrl(accountLabel, secret);
        String svg = totpService.generateQrCodeSvg(otpAuthUrl);

        logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "2FA_QR_GENERATED", "Згенеровано новий секретний ключ та QR-код TOTP");
        return TotpSetupResponse.builder()
                .secret(secret)
                .otpAuthUrl(otpAuthUrl)
                .qrCodeSvg(svg)
                .build();
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public UserSecurityProfileResponse enableTotp(String username, TotpEnableRequest request, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        User user = findUserByIdentifier(username);
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }

        if (!totpService.verifyCode(request.getSecret(), request.getCode(), "setup:" + user.getUsername())) {
            logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "FAILED_BAD_2FA", "Невдала спроба прив'язки 2FA TOTP: невірний 6-значний код");
            throw new BadRequestException("Невірний 6-значний код з автентифікатора. Перевірте код та синхронізацію часу на телефоні.");
        }

        user.setTwoFactorSecret(request.getSecret().trim().toUpperCase());
        user.setTwoFactorMethod("TOTP");
        user.setTwoFactorEnabled(true);
        userRepository.save(user);

        logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "2FA_ENABLED", "Увімкнено двофакторний захист TOTP (Google Authenticator)");
        return mapToProfile(user, null);
    }

    @Transactional
    public UserSecurityProfileResponse toggleTwoFactor(String username, Boolean enabled, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        User user = findUserByIdentifier(username);
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }

        boolean turnOn = Boolean.TRUE.equals(enabled);
        user.setTwoFactorEnabled(turnOn);
        if (turnOn) {
            user.setTwoFactorMethod("EMAIL");
            user.setTwoFactorSecret(null);
        } else {
            user.setTwoFactorSecret(null);
            user.setTwoFactorMethod("EMAIL");
        }
        userRepository.save(user);

        logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device,
                turnOn ? "2FA_ENABLED" : "2FA_DISABLED",
                turnOn ? "Увімкнено двофакторний захист (код на Email)" : "Двофакторну автентифікацію вимкнено");

        return mapToProfile(user, null);
    }

    @Transactional
    public UserSecurityProfileResponse toggleTwoFactor(String username, Boolean enabled) {
        return toggleTwoFactor(username, enabled, null);
    }

    @Transactional
    public UserSecurityProfileResponse updateProfileDetails(
            String currentUsername,
            UpdateProfileDetailsRequest request,
            String currentSessionToken,
            HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);

        User user = findUserByIdentifier(currentUsername);
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim().isEmpty() ? null : request.getPhone().trim());
        }

        String updatedJwt = null;
        if (request.getNewUsername() != null && !request.getNewUsername().isBlank()) {
            String candidate = request.getNewUsername().trim();
            if (!candidate.equalsIgnoreCase(user.getUsername())) {
                if (candidate.length() < 3 || candidate.length() > 40 || !candidate.matches("^[a-zA-Z0-9_.-]+$")) {
                    throw new BadRequestException("Логін має містити від 3 до 40 латинських символів, цифр або символів _ . -");
                }
                if (!"GOOGLE".equalsIgnoreCase(user.getAuthProvider())) {
                    if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()
                            || !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                        logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "PROFILE_UPDATE_DENIED", "Відхилено зміну логіна: невірний поточний пароль");
                        throw new BadRequestException("Для зміни логіна входу необхідно підтвердити поточний пароль");
                    }
                }
                if (userRepository.existsByUsernameIgnoreCase(candidate)) {
                    throw new DuplicateResourceException("Логін '" + candidate + "' вже зайнятий");
                }
                String oldUsername = user.getUsername();
                user.setUsername(candidate);
                userRepository.save(user);

                List<UserSession> activeSessions = userSessionRepository.findByUserIdAndRevokedFalse(user.getId());
                for (UserSession s : activeSessions) {
                    s.setUsername(candidate);
                }
                userSessionRepository.saveAll(activeSessions);

                updatedJwt = jwtService.generateToken(user, currentSessionToken);
                logAudit(candidate, oldUsername, user.getLastLoginIp(), ip, device, "USERNAME_CHANGED",
                        "Змінено секретний логін для входу з '" + oldUsername + "' на '" + candidate + "'");
                return mapToProfile(user, updatedJwt);
            }
        }

        userRepository.save(user);
        logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "PROFILE_UPDATED", "Оновлено контактні дані профілю");
        return mapToProfile(user, null);
    }

    public UserSecurityProfileResponse getUserProfile(String username) {
        User user = findUserByIdentifier(username);
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }
        return mapToProfile(user, null);
    }

    public List<UserSessionResponse> getActiveSessions(String username, String currentSessionToken) {
        User user = findUserByIdentifier(username);
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }
        ZonedDateTime now = ZonedDateTime.now();
        List<UserSession> sessions = userSessionRepository
                .findByUserIdAndRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(user.getId(), now);

        int callerIndex = -1;
        for (int i = 0; i < sessions.size(); i++) {
            if (currentSessionToken != null && currentSessionToken.equals(sessions.get(i).getSessionToken())) {
                callerIndex = i;
                break;
            }
        }

        final int resolvedCallerIdx = callerIndex;
        return java.util.stream.IntStream.range(0, sessions.size())
                .mapToObj(idx -> {
                    UserSession s = sessions.get(idx);
                    boolean isCurrent = currentSessionToken != null && currentSessionToken.equals(s.getSessionToken());
                    boolean isPrimary = idx == 0;
                    boolean canTerminate = !isCurrent && resolvedCallerIdx >= 0 && resolvedCallerIdx < idx;
                    return UserSessionResponse.builder()
                            .id(s.getId())
                            .ipAddress(s.getIpAddress())
                            .deviceInfo(s.getDeviceInfo())
                            .createdAt(s.getCreatedAt())
                            .lastActiveAt(s.getLastActiveAt())
                            .current(isCurrent)
                            .primary(isPrimary)
                            .canTerminate(canTerminate)
                            .build();
                })
                .toList();
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public Map<String, Object> terminateOtherSessions(String username, String currentSessionToken, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        User user = findUserByIdentifier(username);
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }
        ZonedDateTime now = ZonedDateTime.now();
        List<UserSession> sessions = userSessionRepository
                .findByUserIdAndRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(user.getId(), now);

        if (sessions.size() <= 1) {
            return Map.of("terminatedCount", 0, "message", "Інших активних сеансів немає");
        }

        UserSession oldestSession = sessions.get(0);
        if (currentSessionToken == null || !currentSessionToken.equals(oldestSession.getSessionToken())) {
            logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "SESSION_TERMINATE_DENIED",
                    "Відхилено завершення інших сеансів: поточний сеанс не є первинним");
            throw new BadRequestException("Завершити інші сеанси може лише пристрій, який увійшов першим (захист від витіснення власника акаунта)");
        }

        int count = 0;
        for (int i = 1; i < sessions.size(); i++) {
            UserSession s = sessions.get(i);
            s.setRevoked(true);
            s.setRevokedAt(now);
            count++;
        }
        userSessionRepository.saveAll(sessions);

        logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "SESSIONS_TERMINATED",
                "Завершено усі інші активні сеанси (" + count + ")");
        return Map.of("terminatedCount", count, "message", "Успішно завершено інших сеансів: " + count);
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public void terminateSessionById(String username, Long sessionId, String currentSessionToken, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        User user = findUserByIdentifier(username);
        if (user == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }
        ZonedDateTime now = ZonedDateTime.now();
        List<UserSession> sessions = userSessionRepository
                .findByUserIdAndRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(user.getId(), now);

        int callerIdx = -1;
        int targetIdx = -1;
        UserSession targetSession = null;
        for (int i = 0; i < sessions.size(); i++) {
            UserSession s = sessions.get(i);
            if (currentSessionToken != null && currentSessionToken.equals(s.getSessionToken())) {
                callerIdx = i;
            }
            if (s.getId().equals(sessionId)) {
                targetIdx = i;
                targetSession = s;
            }
        }

        if (targetSession == null) {
            throw new ResourceNotFoundException("Активний сеанс не знайдено");
        }
        if (callerIdx == targetIdx) {
            throw new BadRequestException("Для завершення поточного сеансу скористайтеся кнопкою «Вийти»");
        }
        if (callerIdx < 0 || callerIdx > targetIdx) {
            logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "SESSION_TERMINATE_DENIED",
                    "Спроба завершити старіший сеанс із новішого пристрою");
            throw new BadRequestException("Новіший сеанс не може примусово завершити сеанс, який увійшов раніше");
        }

        targetSession.setRevoked(true);
        targetSession.setRevokedAt(now);
        userSessionRepository.save(targetSession);
        logAudit(user.getUsername(), user.getUsername(), user.getLastLoginIp(), ip, device, "SESSION_TERMINATED",
                "Завершено сеанс " + targetSession.getDeviceInfo() + " (IP: " + targetSession.getIpAddress() + ")");
    }

    public List<SecurityAuditResponse> getPersonalSecurityEvents(String username) {
        return auditRepository.findTop30ByUsernameIgnoreCaseOrderByAttemptTimeDesc(username).stream()
                .map(this::mapAudit)
                .toList();
    }

    public List<SecurityAuditResponse> getAuditLogs() {
        return auditRepository.findTop200ByOrderByAttemptTimeDesc().stream()
                .map(this::mapAudit)
                .toList();
    }

    public long countActiveSessions() {
        return userSessionRepository.countByRevokedFalseAndExpiresAtAfter(ZonedDateTime.now());
    }

    @Transactional
    public SupportTicketResponse createSupportTicket(CreateSupportTicketRequest request, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        SupportTicket ticket = SupportTicket.builder()
                .email(email)
                .username(user != null ? user.getUsername() : null)
                .userId(user != null ? user.getId() : null)
                .category(request.getCategory().trim())
                .subject(request.getSubject().trim())
                .description(request.getDescription().trim())
                .ipAddress(ip)
                .status("NEW")
                .build();

        ticket = supportTicketRepository.save(ticket);

        String targetAccount = user != null ? user.getUsername() : email;
        logAudit(targetAccount, targetAccount, user != null ? user.getLastLoginIp() : null, ip, device,
                "SUPPORT_TICKET_CREATED", "Створено звернення в підтримку #" + ticket.getId() + " (" + ticket.getCategory() + ")");

        return mapSupportTicket(ticket, false);
    }

    public List<SupportTicketResponse> getAllSupportTickets() {
        return supportTicketRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(t -> mapSupportTicket(t, true))
                .toList();
    }

    @Transactional
    public SupportTicketResponse updateSupportTicket(
            Long ticketId,
            AdminTicketUpdateRequest request,
            String adminUsername,
            HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Звернення не знайдено"));

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            ticket.setStatus(request.getStatus().trim());
        }
        if (request.getAdminNote() != null) {
            ticket.setAdminNote(request.getAdminNote().trim());
        }

        User linkedUser = ticket.getUserId() != null
                ? userRepository.findById(ticket.getUserId()).orElse(null)
                : userRepository.findByEmailIgnoreCase(ticket.getEmail()).orElse(null);

        if (request.getReplyMessage() != null && !request.getReplyMessage().isBlank()) {
            String reply = request.getReplyMessage().trim();
            ticket.setAdminReply(reply);
            ticket.setRepliedBy(adminUsername);
            ticket.setRepliedAt(ZonedDateTime.now());
            if ("NEW".equalsIgnoreCase(ticket.getStatus())) {
                ticket.setStatus("RESOLVED");
            }
            mockEmailService.sendSupportReplyEmail(
                    ticket.getEmail(),
                    ticket.getUsername(),
                    ticket.getId(),
                    ticket.getSubject(),
                    reply
            );
            logAudit(
                    ticket.getUsername() != null ? ticket.getUsername() : ticket.getEmail(),
                    adminUsername,
                    linkedUser != null ? linkedUser.getLastLoginIp() : null,
                    ip,
                    device,
                    "SUPPORT_REPLY_SENT",
                    "Адміністратор надіслав відповідь по зверненню #" + ticket.getId()
            );
        } else {
            logAudit(
                    ticket.getUsername() != null ? ticket.getUsername() : ticket.getEmail(),
                    adminUsername,
                    linkedUser != null ? linkedUser.getLastLoginIp() : null,
                    ip,
                    device,
                    "SUPPORT_TICKET_UPDATED",
                    "Оновлено статус звернення #" + ticket.getId() + " -> " + ticket.getStatus()
            );
        }

        ticket = supportTicketRepository.save(ticket);
        return mapSupportTicket(ticket, true);
    }

    @Transactional
    public void lockUser(Long userId, String adminUsername, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено"));
        if (adminUsername != null && user.getUsername().equalsIgnoreCase(adminUsername)) {
            throw new BadRequestException("Неможливо заблокувати власний обліковий запис адміністратора");
        }
        user.setIsLocked(true);
        user.setLockedUntil(ZonedDateTime.now().plusYears(10));
        userRepository.save(user);
        revokeAllUserSessions(user.getId());

        logAudit(user.getUsername(), adminUsername != null ? adminUsername : "admin", user.getLastLoginIp(), ip, device,
                "BLOCKED_BY_ADMIN", "Адміністратор заблокував обліковий запис та завершив активні сеанси");
    }

    @Transactional
    public void lockUser(Long userId, String adminUsername) {
        lockUser(userId, adminUsername, null);
    }

    @Transactional
    public void lockUser(Long userId) {
        lockUser(userId, null, null);
    }

    @Transactional
    public void unlockUser(Long userId, String adminUsername, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено"));
        user.setIsLocked(false);
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        logAudit(user.getUsername(), adminUsername != null ? adminUsername : "admin", user.getLastLoginIp(), ip, device,
                "UNBLOCKED_BY_ADMIN", "Адміністратор розблокував обліковий запис");
    }

    @Transactional
    public void unlockUser(Long userId) {
        unlockUser(userId, null, null);
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public void deleteUserByAdmin(Long userId, DeleteUserConfirmRequest request, String adminUsername, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено"));

        if (adminUsername != null && user.getUsername().equalsIgnoreCase(adminUsername)) {
            throw new BadRequestException("Неможливо видалити поточний обліковий запис адміністратора");
        }

        if (!"ВИДАЛИТИ".equals(request.getConfirmKeyword() != null ? request.getConfirmKeyword().trim() : "")) {
            throw new BadRequestException("Для підтвердження введіть слово ВИДАЛИТИ великими літерами");
        }

        String expectedIdentifier = (user.getEmail() != null && !user.getEmail().isBlank())
                ? user.getEmail().trim()
                : user.getUsername().trim();
        String providedIdentifier = request.getConfirmIdentifier() != null ? request.getConfirmIdentifier().trim() : "";

        if (!expectedIdentifier.equalsIgnoreCase(providedIdentifier)
                && !user.getUsername().equalsIgnoreCase(providedIdentifier)) {
            throw new BadRequestException("Введений email або логін не збігається з обліковим записом (" + expectedIdentifier + ")");
        }

        String deletedUsername = user.getUsername();
        String deletedEmail = user.getEmail();
        String ownerIp = user.getLastLoginIp();

        List<Order> assignedOrders = orderRepository.findByTechnicianId(user.getId());
        for (Order order : assignedOrders) {
            order.setTechnician(null);
        }
        if (!assignedOrders.isEmpty()) {
            orderRepository.saveAll(assignedOrders);
        }

        userSessionRepository.deleteByUserId(user.getId());
        userRepository.delete(user);

        logAudit(deletedUsername, adminUsername != null ? adminUsername : "admin", ownerIp, ip, device,
                "USER_DELETED_BY_ADMIN", "Обліковий запис остаточно видалено адміністратором (" + (deletedEmail != null ? deletedEmail : deletedUsername) + ")");
    }

    private AuthResponse buildTwoFactorChallenge(User user, HttpServletRequest httpRequest, String source) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        String username = user.getUsername();
        String method = (user.getTwoFactorMethod() != null && "TOTP".equalsIgnoreCase(user.getTwoFactorMethod()) && user.getTwoFactorSecret() != null)
                ? "TOTP"
                : "EMAIL";

        if ("TOTP".equals(method)) {
            String tempToken = twoFactorAuthService.generateTotpChallengeToken(username);
            logAudit(username, username, user.getLastLoginIp(), ip, device, "TWO_FACTOR_REQUIRED",
                    source + ": очікування підтвердження 6-значним кодом TOTP");
            return AuthResponse.builder()
                    .username(username)
                    .fullName(user.getFullName())
                    .role(user.getRole())
                    .email(user.getEmail())
                    .requiresTwoFactor(true)
                    .twoFactorMethod("TOTP")
                    .tempToken(tempToken)
                    .message("Введіть 6-значний код із застосунку Google Authenticator")
                    .build();
        }

        TwoFactorAuthService.TwoFactorChallenge challenge = twoFactorAuthService.generateChallenge(username);
        mockEmailService.sendTwoFactorOtpEmail(
                user.getEmail() != null ? user.getEmail() : "user@repairhub.ua",
                username,
                challenge.code()
        );
        logAudit(username, username, user.getLastLoginIp(), ip, device, "TWO_FACTOR_REQUIRED",
                source + ": надіслано 6-значний код 2FA на електронну пошту");
        return AuthResponse.builder()
                .username(username)
                .fullName(user.getFullName())
                .role(user.getRole())
                .email(user.getEmail())
                .requiresTwoFactor(true)
                .twoFactorMethod("EMAIL")
                .tempToken(challenge.tempToken())
                .message("На вашу електронну пошту надіслано 6-значний код підтвердження")
                .build();
    }

    private void verifySecondFactorCodeOrThrow(User user, String code, String tempToken, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        String username = user.getUsername();
        boolean isTotp = "TOTP".equalsIgnoreCase(user.getTwoFactorMethod()) && user.getTwoFactorSecret() != null;

        if (isTotp) {
            if (tempToken != null && !tempToken.isBlank() && !twoFactorAuthService.validateChallengeToken(username, tempToken)) {
                logAudit(username, username, user.getLastLoginIp(), ip, device, "FAILED_BAD_2FA", "Сесія очікування 2FA минула або недійсна");
                throw new BadRequestException("Сесія підтвердження 2FA минула. Увійдіть повторно.");
            }
            if (!totpService.verifyCode(user.getTwoFactorSecret(), code, "login:" + username)) {
                twoFactorAuthService.recordFailedChallengeAttempt(username);
                logAudit(username, username, user.getLastLoginIp(), ip, device, "FAILED_BAD_2FA", "Невірний або застарілий 6-значний код TOTP");
                throw new BadRequestException("Невірний або вже використаний 6-значний код з автентифікатора. Дочекайтесь свіжої комбінації.");
            }
            return;
        }

        boolean validEmailOtp = (tempToken != null && !tempToken.isBlank())
                ? twoFactorAuthService.verifyOtp(username, code, tempToken)
                : twoFactorAuthService.verifyOtp(username, code);
        if (!validEmailOtp) {
            logAudit(username, username, user.getLastLoginIp(), ip, device, "FAILED_BAD_2FA", "Невірний або прострочений код 2FA з листа");
            throw new BadRequestException("Невірний або прострочений 6-значний код 2FA");
        }
    }

    private AuthResponse issueAuthenticatedSession(User user, HttpServletRequest httpRequest) {
        String ip = ClientMetadataUtil.extractClientIp(httpRequest);
        String device = ClientMetadataUtil.describeDevice(httpRequest);
        String rawUa = ClientMetadataUtil.extractRawUserAgent(httpRequest);
        ZonedDateTime now = ZonedDateTime.now();

        user.setFailedLoginAttempts(0);
        user.setIsLocked(false);
        user.setLockedUntil(null);
        user.setLastLoginIp(ip);
        user.setLastLoginAt(now);
        userRepository.save(user);

        String sessionToken = UUID.randomUUID().toString();
        long expSeconds = Math.max(3600L, jwtService.getExpirationMs() / 1000L);

        UserSession session = UserSession.builder()
                .sessionToken(sessionToken)
                .userId(user.getId())
                .username(user.getUsername())
                .ipAddress(ip)
                .deviceInfo(device)
                .userAgent(rawUa)
                .lastActiveAt(now)
                .expiresAt(now.plusSeconds(expSeconds))
                .revoked(false)
                .build();
        userSessionRepository.save(session);

        String token = jwtService.generateToken(user, sessionToken);
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
                .twoFactorMethod(user.getTwoFactorMethod())
                .authProvider(user.getAuthProvider())
                .requiresTwoFactor(false)
                .build();
    }

    private int revokeAllUserSessions(Long userId) {
        List<UserSession> active = userSessionRepository.findByUserIdAndRevokedFalse(userId);
        ZonedDateTime now = ZonedDateTime.now();
        for (UserSession session : active) {
            session.setRevoked(true);
            session.setRevokedAt(now);
        }
        if (!active.isEmpty()) {
            userSessionRepository.saveAll(active);
        }
        return active.size();
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

    private void logAudit(
            String targetUsername,
            String actorUsername,
            String ownerIp,
            String actionIp,
            String deviceInfo,
            String status,
            String details) {
        try {
            LoginAudit audit = LoginAudit.builder()
                    .username(targetUsername != null && !targetUsername.isBlank() ? targetUsername : "unknown")
                    .actorUsername(actorUsername != null && !actorUsername.isBlank() ? actorUsername : targetUsername)
                    .userIpAddress(ownerIp != null && !ownerIp.isBlank() ? ownerIp : "—")
                    .ipAddress(actionIp != null && !actionIp.isBlank() ? actionIp : "127.0.0.1")
                    .userAgent(deviceInfo != null ? deviceInfo : "Web • Local")
                    .status(status)
                    .details(details)
                    .build();
            auditRepository.save(audit);
        } catch (Exception ignored) {
        }
    }

    private SecurityAuditResponse mapAudit(LoginAudit a) {
        return SecurityAuditResponse.builder()
                .id(a.getId())
                .username(a.getUsername())
                .actorUsername(a.getActorUsername() != null ? a.getActorUsername() : a.getUsername())
                .userIpAddress(a.getUserIpAddress() != null ? a.getUserIpAddress() : "—")
                .ipAddress(a.getIpAddress())
                .userAgent(a.getUserAgent())
                .attemptTime(a.getAttemptTime())
                .status(a.getStatus())
                .details(a.getDetails())
                .build();
    }

    private SupportTicketResponse mapSupportTicket(SupportTicket t, boolean includeContext) {
        UserResponse linkedUserDto = null;
        List<SecurityAuditResponse> events = List.of();

        if (includeContext) {
            User u = t.getUserId() != null
                    ? userRepository.findById(t.getUserId()).orElse(null)
                    : userRepository.findByEmailIgnoreCase(t.getEmail()).orElse(null);
            if (u != null) {
                ZonedDateTime now = ZonedDateTime.now();
                boolean effectivelyLocked = Boolean.TRUE.equals(u.getIsLocked())
                        && (u.getLockedUntil() == null || now.isBefore(u.getLockedUntil()));
                linkedUserDto = UserResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .fullName(u.getFullName())
                        .role(u.getRole())
                        .email(u.getEmail())
                        .phone(u.getPhone())
                        .emailVerified(u.getEmailVerified())
                        .isLocked(effectivelyLocked)
                        .lockedUntil(u.getLockedUntil())
                        .failedLoginAttempts(u.getFailedLoginAttempts())
                        .twoFactorEnabled(u.getTwoFactorEnabled())
                        .twoFactorMethod(u.getTwoFactorMethod())
                        .authProvider(u.getAuthProvider())
                        .googleEmail(u.getGoogleEmail())
                        .lastLoginIp(u.getLastLoginIp())
                        .lastLoginAt(u.getLastLoginAt())
                        .isActive(u.getIsActive())
                        .createdAt(u.getCreatedAt())
                        .build();
                events = auditRepository.findTop30ByUsernameIgnoreCaseOrderByAttemptTimeDesc(u.getUsername())
                        .stream()
                        .limit(12)
                        .map(this::mapAudit)
                        .toList();
            }
        }

        return SupportTicketResponse.builder()
                .id(t.getId())
                .email(t.getEmail())
                .username(t.getUsername())
                .userId(t.getUserId())
                .category(t.getCategory())
                .subject(t.getSubject())
                .description(t.getDescription())
                .ipAddress(t.getIpAddress())
                .status(t.getStatus())
                .adminNote(t.getAdminNote())
                .adminReply(t.getAdminReply())
                .repliedBy(t.getRepliedBy())
                .repliedAt(t.getRepliedAt())
                .createdAt(t.getCreatedAt())
                .linkedUser(linkedUserDto)
                .recentEvents(events)
                .build();
    }

    private UserSecurityProfileResponse mapToProfile(User user, String updatedToken) {
        boolean googleConnected = "GOOGLE".equalsIgnoreCase(user.getAuthProvider())
                || "LOCAL+GOOGLE".equalsIgnoreCase(user.getAuthProvider())
                || (user.getGoogleEmail() != null && !user.getGoogleEmail().isBlank());
        return UserSecurityProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .emailVerified(user.getEmailVerified())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .twoFactorMethod(user.getTwoFactorMethod() != null ? user.getTwoFactorMethod() : "EMAIL")
                .isLocked(user.getIsLocked())
                .failedLoginAttempts(user.getFailedLoginAttempts())
                .authProvider(user.getAuthProvider())
                .googleConnected(googleConnected)
                .googleEmail(user.getGoogleEmail() != null ? user.getGoogleEmail() : (googleConnected ? user.getEmail() : null))
                .lastLoginIp(user.getLastLoginIp())
                .lastLoginAt(user.getLastLoginAt())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedToken(updatedToken)
                .build();
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        String[] parts = email.split("@", 2);
        String name = parts[0];
        String domain = parts[1];
        String maskedName = name.length() <= 2
                ? name.charAt(0) + "***"
                : name.substring(0, 2) + "***" + name.charAt(name.length() - 1);
        return maskedName + "@" + domain;
    }
}
