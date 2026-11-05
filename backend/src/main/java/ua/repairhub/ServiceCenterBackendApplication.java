package ua.repairhub;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import ua.repairhub.model.Role;
import ua.repairhub.model.ServiceEntity;
import ua.repairhub.model.SparePart;
import ua.repairhub.model.User;
import ua.repairhub.repository.ServiceRepository;
import ua.repairhub.repository.SparePartRepository;
import ua.repairhub.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@SpringBootApplication
public class ServiceCenterBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceCenterBackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(
            UserRepository userRepository,
            ServiceRepository serviceRepository,
            SparePartRepository sparePartRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            log.info("Ініціалізація та перевірка облікових записів персоналу...");

            initOrUpdateUser(userRepository, passwordEncoder, "admin_oleg", "admin123", "Олег Петренко", Role.ROLE_ADMIN, "+380671112233", "admin@repairhub.ua");
            initOrUpdateUser(userRepository, passwordEncoder, "mgr_alina", "manager123", "Аліна Ковальчук", Role.ROLE_MANAGER, "+380502223344", "manager@repairhub.ua");
            initOrUpdateUser(userRepository, passwordEncoder, "tech_taras", "tech123", "Тарас Бондаренко", Role.ROLE_TECHNICIAN, "+380633334455", "tech@repairhub.ua");
            initOrUpdateUser(userRepository, passwordEncoder, "tech_dmytro", "tech123", "Дмитро Мельник", Role.ROLE_TECHNICIAN, "+380994445566", "dmytro@repairhub.ua");
            initOrUpdateUser(userRepository, passwordEncoder, "user_vlad", "Vlad@2026!", "Владислав Яворський", Role.ROLE_USER, "+380991234567", "vlad@repairhub.ua");

            if (serviceRepository.count() == 0) {
                serviceRepository.saveAll(List.of(
                        ServiceEntity.builder().name("Апаратна діагностика вузлів").description("Повне тестування кіл живлення та компонентів").standardPrice(BigDecimal.valueOf(250)).build(),
                        ServiceEntity.builder().name("Комплексна чистка та заміна термопасти").description("Розбирання, видалення пилу, нанесення термоінтерфейсу").standardPrice(BigDecimal.valueOf(600)).build(),
                        ServiceEntity.builder().name("Заміна дисплейного модуля смартфона").description("Демонтаж пошкодженого екрана, проклейка та калібрування").standardPrice(BigDecimal.valueOf(800)).build(),
                        ServiceEntity.builder().name("Заміна акумуляторної батареї").description("Встановлення нового елемента живлення та тест ємності").standardPrice(BigDecimal.valueOf(450)).build(),
                        ServiceEntity.builder().name("Заміна роз'єму зарядки (USB Type-C / Lightning)").description("Мікропайка нового роз'єму живлення").standardPrice(BigDecimal.valueOf(550)).build(),
                        ServiceEntity.builder().name("Ультразвукова чистка плати після рідини").description("Відновлення доріжок та очищення від корозії").standardPrice(BigDecimal.valueOf(900)).build()
                ));
                log.info("Ініціалізовано стартовий прайс-лист послуг");
            }

            if (sparePartRepository.count() == 0) {
                sparePartRepository.saveAll(List.of(
                        SparePart.builder().sku("TH-MX4-4G").name("Термопаста Arctic MX-4 (4г)").category("Витратні матеріали").purchasePrice(BigDecimal.valueOf(150)).retailPrice(BigDecimal.valueOf(250)).stockQuantity(15).minStockLimit(3).build(),
                        SparePart.builder().sku("DISP-IPH13P-OEM").name("Дисплейний модуль iPhone 13 Pro (OEM)").category("Дисплеї").purchasePrice(BigDecimal.valueOf(2800)).retailPrice(BigDecimal.valueOf(4000)).stockQuantity(4).minStockLimit(2).build(),
                        SparePart.builder().sku("BAT-SAM-S8").name("Акумулятор Samsung Galaxy Tab S8").category("Акумулятори").purchasePrice(BigDecimal.valueOf(900)).retailPrice(BigDecimal.valueOf(1400)).stockQuantity(6).minStockLimit(2).build(),
                        SparePart.builder().sku("CON-TYPEC-GEN").name("Роз'єм живлення USB Type-C").category("Шлейфи та роз'єми").purchasePrice(BigDecimal.valueOf(40)).retailPrice(BigDecimal.valueOf(120)).stockQuantity(50).minStockLimit(10).build()
                ));
                log.info("Ініціалізовано стартовий склад запчастин");
            }

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
                    user.setEmailVerified(true);
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
