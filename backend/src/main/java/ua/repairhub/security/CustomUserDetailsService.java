package ua.repairhub.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import ua.repairhub.model.User;
import ua.repairhub.repository.UserRepository;

import java.time.ZonedDateTime;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String identifier = username != null ? username.trim() : "";
        User user = userRepository.findByUsernameIgnoreCase(identifier)
                .or(() -> userRepository.findByEmailIgnoreCase(identifier))
                .orElseThrow(() -> new UsernameNotFoundException("Користувача '" + username + "' не знайдено"));

        boolean accountNonLocked = !Boolean.TRUE.equals(user.getIsLocked())
                || (user.getLockedUntil() != null && ZonedDateTime.now().isAfter(user.getLockedUntil()));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                Boolean.TRUE.equals(user.getIsActive()),
                true,
                true,
                accountNonLocked,
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()))
        );
    }
}
