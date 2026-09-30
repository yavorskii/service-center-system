package ua.repairhub.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.repairhub.dto.request.LoginRequest;
import ua.repairhub.dto.request.RegisterRequest;
import ua.repairhub.dto.response.AuthResponse;
import ua.repairhub.exception.DuplicateResourceException;
import ua.repairhub.exception.ResourceNotFoundException;
import ua.repairhub.model.User;
import ua.repairhub.repository.UserRepository;
import ua.repairhub.security.JwtService;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено"));

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Користувач із логіном '" + request.getUsername() + "' вже зареєстрований");
        }

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(request.getRole())
                .phone(request.getPhone())
                .isActive(true)
                .build();

        user = userRepository.save(user);
        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
