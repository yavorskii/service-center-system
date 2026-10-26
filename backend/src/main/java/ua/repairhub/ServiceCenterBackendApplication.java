package ua.repairhub;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import ua.repairhub.model.Role;
import ua.repairhub.model.User;
import ua.repairhub.repository.UserRepository;

@Slf4j
@SpringBootApplication
public class ServiceCenterBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceCenterBackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            log.info("Ініціалізація та перевірка облікових записів персоналу...");

            initOrUpdateUser(userRepository, passwordEncoder, "admin_oleg", "admin123", "Олег Петренко", Role.ROLE_ADMIN, "+380671112233", "admin@repairhub.ua");
            initOrUpdateUser(userRepository, passwordEncoder, "mgr_alina", "manager123", "Аліна Ковальчук", Role.ROLE_MANAGER, "+380502223344", "manager@repairhub.ua");
            initOrUpdateUser(userRepository, passwordEncoder, "tech_taras", "tech123", "Тарас Бондаренко", Role.ROLE_TECHNICIAN, "+380633334455", "tech@repairhub.ua");
            initOrUpdateUser(userRepository, passwordEncoder, "user_vlad", "Vlad@2026!", "Владислав Яворський", Role.ROLE_USER, "+380991234567", "vlad@repairhub.ua");

            log.info("Серверний додаток RepairHub REST API успішно запущено!");
            log.info("Swagger UI документація доступна за адресою: http://localhost:8080/swagger-ui.html");
            log.info("OpenAPI специфікація: http://localhost:8080/v3/api-docs");
        };
    }

    private void initOrUpdateUser(UserRepository repo, PasswordEncoder encoder, String username, String rawPassword, String fullName, Role role, String phone, String email) {
        repo.findByUsername(username).ifPresentOrElse(
                user -> {
                    user.setFullName(fullName);
                    user.setRole(role);
                    user.setPhone(phone);
                    user.setEmail(email);
                    if (user.getEmailVerified() == null) {
                        user.setEmailVerified(true);
                    }
                    if (user.getIsLocked() == null) {
                        user.setIsLocked(false);
                    }
                    if (user.getFailedLoginAttempts() == null) {
                        user.setFailedLoginAttempts(0);
                    }
                    if (user.getAuthProvider() == null) {
                        user.setAuthProvider("LOCAL");
                    }
                    if (user.getTwoFactorEnabled() == null) {
                        user.setTwoFactorEnabled(false);
                    }
                    if (!user.getPasswordHash().startsWith("$2a$") || user.getPasswordHash().endsWith("...")) {
                        user.setPasswordHash(encoder.encode(rawPassword));
                    }
                    repo.save(user);
                    log.info("Оновлено користувача '{}'", username);
                },
                () -> {
                    User newUser = User.builder()
                            .username(username)
                            .passwordHash(encoder.encode(rawPassword))
                            .fullName(fullName)
                            .role(role)
                            .phone(phone)
                            .email(email)
                            .emailVerified(true)
                            .failedLoginAttempts(0)
                            .isLocked(false)
                            .authProvider("LOCAL")
                            .twoFactorEnabled(false)
                            .isActive(true)
                            .build();
                    repo.save(newUser);
                    log.info("Створено нового користувача '{}' з роллю {}", username, role);
                }
        );
    }
}
