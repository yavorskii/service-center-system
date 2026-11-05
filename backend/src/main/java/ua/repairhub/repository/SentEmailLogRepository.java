package ua.repairhub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.repairhub.model.SentEmailLog;

import java.util.List;

@Repository
public interface SentEmailLogRepository extends JpaRepository<SentEmailLog, Long> {
    List<SentEmailLog> findTop200ByOrderBySentAtDesc();
}
