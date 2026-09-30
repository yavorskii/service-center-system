package ua.repairhub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.repairhub.model.Device;

import java.util.List;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Long> {
    List<Device> findByClientId(Long clientId);
}
