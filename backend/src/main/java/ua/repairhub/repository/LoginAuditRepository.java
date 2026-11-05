package ua.repairhub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.repairhub.model.LoginAudit;

import java.util.List;

@Repository
public interface LoginAuditRepository extends JpaRepository<LoginAudit, Long> {
    List<LoginAudit> findTop200ByOrderByAttemptTimeDesc();
    List<LoginAudit> findTop100ByOrderByAttemptTimeDesc();
    List<LoginAudit> findTop30ByUsernameIgnoreCaseOrderByAttemptTimeDesc(String username);
    List<LoginAudit> findByUsernameOrderByAttemptTimeDesc(String username);
}
