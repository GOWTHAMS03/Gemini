package com.breadfactory.erp.security;

import com.breadfactory.erp.entity.User;
import com.breadfactory.erp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        boolean isSalesPerson = user.getRoles().stream()
                .anyMatch(r -> r.getName().name().equals("ROLE_SALES_EXECUTIVE") || r.getName().name().equals("ROLE_DRIVER"));

        if (isSalesPerson && user.getMobileAccessEnabled() != null && !user.getMobileAccessEnabled()) {
            throw new org.springframework.security.authentication.DisabledException("You don't have access. Contact admin team.");
        }

        return UserPrincipal.create(user);
    }
}
