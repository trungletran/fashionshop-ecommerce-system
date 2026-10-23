package com.example.fashionshop.modules.user.service;

import com.example.fashionshop.common.enums.AccountStatus;
import com.example.fashionshop.common.enums.Role;
import com.example.fashionshop.modules.order.repository.OrderRepository;
import com.example.fashionshop.modules.user.entity.User;
import com.example.fashionshop.modules.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAvatarServiceTest {
    @Mock UserRepository userRepository;
    @Mock OrderRepository orderRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AvatarStorageService storage;
    @InjectMocks UserServiceImpl service;

    @AfterEach void clearContext() { SecurityContextHolder.clearContext(); }

    private User login() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user@example.com", "n/a"));
        User user = User.builder().id(4).email("user@example.com").fullName("User")
                .role(Role.CUSTOMER).isActive(true).accountStatus(AccountStatus.ACTIVE)
                .avatarUrl("old-url").avatarStorageKey("legacy-key").build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        return user;
    }

    private MockMultipartFile validPng() throws Exception {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        ImageIO.write(image, "png", bytes);
        return new MockMultipartFile("file", "../../evil.png", "image/png", bytes.toByteArray());
    }

    @Test void uploadsValidImageForAuthenticatedPrincipalOnly() throws Exception {
        User user = login();
        when(storage.store(any(), eq("image/png"), eq(4)))
                .thenReturn(new AvatarStorageService.StoredAvatar("https://cdn.example/new.png", "fashionshop/avatars/4/new"));
        when(userRepository.save(user)).thenReturn(user);
        var response = service.updateMyAvatar(validPng());
        assertEquals("https://cdn.example/new.png", response.getAvatarUrl());
        assertEquals("fashionshop/avatars/4/new", user.getAvatarStorageKey());
        verify(storage, never()).delete("legacy-key");
        verify(storage).store(any(), eq("image/png"), eq(4));
    }

    @Test void rejectsMissingAuthenticationAndMalformedImage() throws Exception {
        assertThrows(RuntimeException.class, () -> service.updateMyAvatar(validPng()));
        login();
        var invalid = new MockMultipartFile("file", "fake.png", "image/png", "not an image".getBytes());
        assertEquals("AVATAR_INVALID_IMAGE", assertThrows(AvatarUploadException.class,
                () -> service.updateMyAvatar(invalid)).getCode());
        verifyNoInteractions(storage);
    }

    @Test void storageFailureLeavesExistingAvatarUntouched() throws Exception {
        User user = login();
        when(storage.store(any(), anyString(), anyInt())).thenThrow(new IllegalStateException("provider down"));
        assertEquals("AVATAR_STORAGE_FAILURE", assertThrows(AvatarUploadException.class,
                () -> service.updateMyAvatar(validPng())).getCode());
        assertEquals("old-url", user.getAvatarUrl());
        assertEquals("legacy-key", user.getAvatarStorageKey());
    }

    @Test void databaseFailureCleansNewAssetAndPreservesOldAvatar() throws Exception {
        User user = login();
        when(storage.store(any(), anyString(), anyInt()))
                .thenReturn(new AvatarStorageService.StoredAvatar("new-url", "fashionshop/avatars/4/new"));
        when(userRepository.save(user)).thenThrow(new DataIntegrityViolationException("db down"));
        assertEquals("AVATAR_DATABASE_FAILURE", assertThrows(AvatarUploadException.class,
                () -> service.updateMyAvatar(validPng())).getCode());
        assertEquals("old-url", user.getAvatarUrl());
        assertEquals("legacy-key", user.getAvatarStorageKey());
        verify(storage).delete("fashionshop/avatars/4/new");
    }
}
