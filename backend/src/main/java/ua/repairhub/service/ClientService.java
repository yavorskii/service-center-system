package ua.repairhub.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.repairhub.dto.response.ClientResponse;
import ua.repairhub.exception.ResourceNotFoundException;
import ua.repairhub.model.Client;
import ua.repairhub.repository.ClientRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;

    @Transactional(readOnly = true)
    public List<ClientResponse> getAllClients() {
        return clientRepository.findAll().stream()
                .map(DtoMapper::toClientResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClientResponse getClientById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Клієнта з ID " + id + " не знайдено"));
        return DtoMapper.toClientResponse(client);
    }
}
