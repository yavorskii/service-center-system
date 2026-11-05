package ua.repairhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleCodeRequest {

    @NotBlank(message = "Код авторизації Google є обов'язковим")
    private String code;

    private String redirectUri;
}
