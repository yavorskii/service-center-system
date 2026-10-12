package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.repairhub.dto.response.UserResponse;
import ua.repairhub.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Управління персоналом та обліковими записами сервісного центру")
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Отримати список співробітників", description = "Доступно лише для адміністратора")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> list = userRepository.findAll().stream()
                .map(u -> UserResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .fullName(u.getFullName())
                        .role(u.getRole())
                        .phone(u.getPhone())
                        .isActive(u.getIsActive())
                        .createdAt(u.getCreatedAt())
                        .build())
                .toList();
        return ResponseEntity.ok(list);
    }
}
