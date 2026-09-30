package ua.repairhub.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI repairHubOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("RepairHub CRM - Service Center REST API")
                        .description("Серверний REST API для інформаційної системи управління замовленнями сервісного центру (Варіант № 19)")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Владислав Яворський")
                                .email("vladyavorskii295@gmail.com"))
                        .license(new License().name("Educational Use").url("https://github.com/yavorskii/service-center-system")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Введіть JWT токен авторизації у форматі: Bearer <ваш_токен>")));
    }
}
