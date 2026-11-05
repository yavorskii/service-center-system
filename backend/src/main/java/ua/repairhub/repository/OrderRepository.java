package ua.repairhub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.repairhub.model.Order;
import ua.repairhub.model.OrderStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    @Query("SELECT o FROM Order o " +
           "JOIN FETCH o.client " +
           "JOIN FETCH o.device " +
           "LEFT JOIN FETCH o.technician " +
           "WHERE UPPER(o.trackingCode) = UPPER(:trackingCode) " +
           "OR UPPER(o.orderNumber) = UPPER(:trackingCode)")
    Optional<Order> findByTrackingCode(@Param("trackingCode") String trackingCode);

    @Query("SELECT o FROM Order o " +
           "JOIN FETCH o.client " +
           "JOIN FETCH o.device " +
           "LEFT JOIN FETCH o.technician " +
           "WHERE UPPER(o.trackingCode) LIKE UPPER(CONCAT('%', :query, '%')) " +
           "OR UPPER(o.orderNumber) LIKE UPPER(CONCAT('%', :query, '%')) " +
           "OR o.client.phone LIKE CONCAT('%', :query, '%') " +
           "ORDER BY o.createdAt DESC")
    List<Order> publicSearchOrders(@Param("query") String query);

    List<Order> findByStatus(OrderStatus status);

    long countByStatus(OrderStatus status);

    Optional<Order> findTopByOrderByIdDesc();

    @Query("SELECT o FROM Order o " +
           "JOIN FETCH o.client " +
           "JOIN FETCH o.device " +
           "LEFT JOIN FETCH o.technician " +
           "WHERE (:status IS NULL OR o.status = :status) " +
           "AND (:search IS NULL OR :search = '' OR " +
           "LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(o.trackingCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(o.client.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "o.client.phone LIKE CONCAT('%', :search, '%') OR " +
           "LOWER(o.device.brand) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(o.device.model) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY o.createdAt DESC")
    List<Order> searchOrders(@Param("search") String search, @Param("status") OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.totalCost), 0) FROM Order o")
    BigDecimal calculateTotalRevenue();

    List<Order> findByTechnicianId(Long technicianId);
}
