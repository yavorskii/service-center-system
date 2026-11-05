package ua.repairhub.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSupportTicketRequest {
    @NotBlank(message = "Email є обов'язковим")
    @Email(message = "Некоректний формат email")
    private String email;

    @NotBlank(message = "Категорія є обов'язковою")
    private String category;

    @NotBlank(message = "Тема звернення є обов'язковою")
    private String subject;

    @NotBlank(message = "Опис звернення є обов'язковим")
    private String description;
}
