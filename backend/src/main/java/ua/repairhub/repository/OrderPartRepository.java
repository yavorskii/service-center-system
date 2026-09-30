package ua.repairhub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.repairhub.model.OrderPart;

import java.util.List;

@Repository
public interface OrderPartRepository extends JpaRepository<OrderPart, Long> {
    List<OrderPart> findByOrderId(Long orderId);
}
