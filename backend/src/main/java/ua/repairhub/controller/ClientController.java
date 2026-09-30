package ua.repairhub.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.repairhub.dto.response.ClientResponse;
import ua.repairhub.service.ClientService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clients")
@RequiredArgsConstructor
@Tag(name = "Clients", description = "Управління клієнтською базою сервісного центру")
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    @Operation(summary = "Отримати всіх клієнтів")
    public ResponseEntity<List<ClientResponse>> getAllClients() {
        return ResponseEntity.ok(clientService.getAllClients());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Отримати клієнта за ID")
    public ResponseEntity<ClientResponse> getClientById(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.getClientById(id));
    }
}
