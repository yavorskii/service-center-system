package ua.repairhub.service;

import org.springframework.stereotype.Component;
import ua.repairhub.exception.BadRequestException;

import java.util.Set;
import java.util.regex.Pattern;

@Component
public class PasswordPolicyValidator {

    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_PATTERN = Pattern.compile("[^a-zA-Z0-9]");

    private static final Set<String> COMMON_WEAK_PASSWORDS = Set.of(
            "password", "12345678", "123456789", "1234567890", "qwertyui",
            "admin123", "letmein1", "password123", "welcome1", "iloveyou"
    );

    public void validate(String password) {
        if (password == null || password.length() < 8) {
            throw new BadRequestException("Пароль повинен містити не менше 8 символів");
        }

        if (COMMON_WEAK_PASSWORDS.contains(password.toLowerCase().trim())) {
            throw new BadRequestException("Пароль занадто поширений або передбачуваний. Оберіть надійніший варіант");
        }

        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            throw new BadRequestException("Пароль повинен містити хоча б одну велику літеру (A-Z)");
        }

        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            throw new BadRequestException("Пароль повинен містити хоча б одну малу літеру (a-z)");
        }

        if (!DIGIT_PATTERN.matcher(password).find()) {
            throw new BadRequestException("Пароль повинен містити хоча б одну цифру (0-9)");
        }

        if (!SPECIAL_PATTERN.matcher(password).find()) {
            throw new BadRequestException("Пароль повинен містити хоча б один спеціальний символ (напр. !@#$%^&*)");
        }
    }
}
