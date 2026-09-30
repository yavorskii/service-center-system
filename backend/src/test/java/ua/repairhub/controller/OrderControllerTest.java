package ua.repairhub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ua.repairhub.dto.request.CreateOrderRequest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/v1/tracking/{trackingCode} - Публічний доступ без авторизації повертає 200")
    void trackOrder_PublicAccess_Success() throws Exception {
        // TRK-A8F91B was inserted by seed_data.sql in Lab 5
        mockMvc.perform(get("/api/v1/tracking/TRK-A8F91B"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber").value("SRV-2026-0001"))
                .andExpect(jsonPath("$.trackingCode").value("TRK-A8F91B"))
                .andExpect(jsonPath("$.status").exists());
    }

    @Test
    @DisplayName("GET /api/v1/tracking/{trackingCode} - Невідомий трек-код повертає 404 Not Found")
    void trackOrder_NotFound() throws Exception {
        mockMvc.perform(get("/api/v1/tracking/TRK-UNKNOWN999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("POST /api/v1/orders - Спроба створення без авторизації повертає 403 Forbidden")
    void createOrder_Unauthorized_ReturnsForbidden() throws Exception {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .clientName("Тестовий Клієнт")
                .clientPhone("+380991112233")
                .deviceType("Ноутбук")
                .brand("Dell")
                .model("XPS 15")
                .defectDescription("Не заряджається")
                .build();

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
