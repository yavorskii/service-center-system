package ua.repairhub.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import ua.repairhub.model.UserSession;
import ua.repairhub.repository.UserSessionRepository;
import ua.repairhub.security.CustomUserDetailsService;
import ua.repairhub.security.JwtService;

import java.io.IOException;
import java.time.ZonedDateTime;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final UserSessionRepository userSessionRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        try {
            final String username = jwtService.extractUsername(jwt);
            final String sessionId = jwtService.extractSessionId(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                boolean sessionAllowed = true;
                if (sessionId != null && !sessionId.isBlank()) {
                    UserSession session = userSessionRepository.findBySessionToken(sessionId).orElse(null);
                    ZonedDateTime now = ZonedDateTime.now();
                    if (session == null || Boolean.TRUE.equals(session.getRevoked()) || now.isAfter(session.getExpiresAt())) {
                        sessionAllowed = false;
                    } else if (session.getLastActiveAt() == null || session.getLastActiveAt().plusSeconds(20).isBefore(now)) {
                        session.setLastActiveAt(now);
                        userSessionRepository.save(session);
                    }
                }

                if (sessionAllowed) {
                    UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                    if (jwtService.isTokenValid(jwt, userDetails)
                            && userDetails.isEnabled()
                            && userDetails.isAccountNonLocked()) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                jwt,
                                userDetails.getAuthorities()
                        );
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("JWT token processing failed: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
