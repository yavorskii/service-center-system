package ua.repairhub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.repairhub.model.ServiceEntity;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {
}
