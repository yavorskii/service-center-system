package ua.repairhub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.repairhub.model.SparePart;

import java.util.List;
import java.util.Optional;

@Repository
public interface SparePartRepository extends JpaRepository<SparePart, Long> {

    Optional<SparePart> findBySku(String sku);

    boolean existsBySku(String sku);

    List<SparePart> findByCategory(String category);

    @Query("SELECT sp FROM SparePart sp " +
           "WHERE (:query IS NULL OR :query = '' OR " +
           "LOWER(sp.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(sp.sku) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(sp.category) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY sp.name ASC")
    List<SparePart> searchSpareParts(@Param("query") String query);
}
