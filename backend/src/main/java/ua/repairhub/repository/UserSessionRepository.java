package ua.repairhub.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.repairhub.model.UserSession;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    Optional<UserSession> findBySessionToken(String sessionToken);
    List<UserSession> findByUserIdAndRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(Long userId, ZonedDateTime now);
    List<UserSession> findByUserIdAndRevokedFalse(Long userId);
    long countByRevokedFalseAndExpiresAtAfter(ZonedDateTime now);
    void deleteByUserId(Long userId);
}
