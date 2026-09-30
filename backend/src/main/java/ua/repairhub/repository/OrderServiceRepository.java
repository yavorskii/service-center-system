package ua.repairhub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.repairhub.model.OrderServiceEntity;

import java.util.List;

@Repository
public interface OrderServiceRepository extends JpaRepository<OrderServiceEntity, Long> {
    List<OrderServiceEntity> findByOrderId(Long orderId);
}
