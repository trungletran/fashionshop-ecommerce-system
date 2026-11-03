package com.example.fashionshop.security.jwt;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotEquals;

class JwtServiceTest {
    @Test
    void generatesUniqueTokensForRepeatedLoginsInSameSecond() {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "jwtSecret", "dGVzdC1zZWNyZXQta2V5LWZvci11bml0LXRlc3Rpbmctb25seQ==");
        ReflectionTestUtils.setField(service, "jwtExpirationMs", 86_400_000L);
        var user = new User("customer@example.com", "password", List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));

        String firstToken = service.generateToken(user);
        String secondToken = service.generateToken(user);

        assertNotEquals(firstToken, secondToken);
    }
}
