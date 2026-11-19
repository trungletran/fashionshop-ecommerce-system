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
import java.util.Arrays;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

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

    @Test void enforcesExactByteBoundaryBeforeStorage() throws Exception {
        User user = login();
        byte[] bytes = new byte[5_242_881];
        var oversized = new MockMultipartFile("file", "avatar.png", "image/png", bytes);
        assertEquals("AVATAR_FILE_TOO_LARGE", assertThrows(AvatarUploadException.class,
                () -> service.updateMyAvatar(oversized)).getCode());
        verifyNoInteractions(storage);
        assertEquals("old-url", user.getAvatarUrl());
    }

    @Test void acceptsExactFiveMibBoundary() throws Exception {
        User user = login();
        byte[] valid = validPng().getBytes();
        byte[] exactlyFiveMib = Arrays.copyOf(valid, 5_242_880);
        when(storage.store(any(), eq("image/png"), eq(4)))
                .thenReturn(new AvatarStorageService.StoredAvatar("new-url", "fashionshop/avatars/4/new"));
        when(userRepository.save(user)).thenReturn(user);

        service.updateMyAvatar(new MockMultipartFile("file", "avatar.png", "image/png", exactlyFiveMib));

        verify(storage).store(any(), eq("image/png"), eq(4));
    }

    @Test void rejectsImagesOverDimensionBoundariesBeforeStorage() throws Exception {
        login();
        assertEquals("AVATAR_INVALID_IMAGE", assertThrows(AvatarUploadException.class,
                () -> service.updateMyAvatar(AvatarTestFixtures.png(4097, 1))).getCode());
        assertEquals("AVATAR_INVALID_IMAGE", assertThrows(AvatarUploadException.class,
                () -> service.updateMyAvatar(AvatarTestFixtures.png(1, 4097))).getCode());
        verifyNoInteractions(storage);
    }

    @Test void rejectsContentTypeExtensionMismatchBeforeStorage() throws Exception {
        login();
        var mismatch = new MockMultipartFile("file", "avatar.jpg", "image/png", new byte[] {1, 2, 3});
        assertEquals("AVATAR_INVALID_IMAGE", assertThrows(AvatarUploadException.class,
                () -> service.updateMyAvatar(mismatch)).getCode());
        verifyNoInteractions(storage);
    }

    @Test void enforcesDimensionAndTotalPixelBoundariesWithoutOverflow() {
        assertTrue(UserServiceImpl.isDimensionAllowed(4096, 4096));
        assertFalse(UserServiceImpl.isDimensionAllowed(4097, 1));
        assertFalse(UserServiceImpl.isDimensionAllowed(1, 4097));
        assertFalse(UserServiceImpl.isDimensionAllowed(4096, 4097));
        assertFalse(UserServiceImpl.isDimensionAllowed(Integer.MAX_VALUE, Integer.MAX_VALUE));
        assertTrue(UserServiceImpl.isPixelCountAllowed(16_777_216L));
        assertFalse(UserServiceImpl.isPixelCountAllowed(16_777_217L));
    }

    @ParameterizedTest
    @MethodSource("unsupportedImageInputs")
    void rejectsUnsupportedMalformedAndEmptyImagesBeforeStorage(String name, String contentType, byte[] content) {
        login();
        var file = new MockMultipartFile("file", name, contentType, content);
        assertNotNull(assertThrows(AvatarUploadException.class, () -> service.updateMyAvatar(file)));
        verifyNoInteractions(storage);
    }

    static Stream<Arguments> unsupportedImageInputs() throws Exception {
        byte[] validPng = AvatarTestFixtures.png(2, 2).getBytes();
        byte[] validJpeg = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", jpegBytes()).getBytes();
        return Stream.of(
                Arguments.of("avatar.svg", "image/png", "<svg xmlns=\"http://www.w3.org/2000/svg\"/>".getBytes()),
                Arguments.of("avatar.gif", "image/png", new byte[]{'G', 'I', 'F', '8', '9', 'a'}),
                Arguments.of("avatar.webp", "image/png", new byte[]{'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'}),
                Arguments.of("avatar.bmp", "image/bmp", new byte[]{'B', 'M', 1, 2, 3}),
                Arguments.of("avatar.png", "image/jpeg", validPng),
                Arguments.of("avatar.jpg", "image/png", validJpeg),
                Arguments.of("avatar.jpg", "image/jpeg", Arrays.copyOf(validJpeg, validJpeg.length / 2)),
                Arguments.of("avatar.png", "image/png", Arrays.copyOf(validPng, validPng.length / 2)),
                Arguments.of("avatar.png", "image/png", new byte[0])
        );
    }

    private static byte[] jpegBytes() throws Exception {
        var image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        var output = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", output);
        return output.toByteArray();
    }

    @Test void rejectsInactiveAccountsBeforeStorage() throws Exception {
        User user = login();
        user.setIsActive(false);
        user.setAccountStatus(AccountStatus.LOCKED);
        assertThrows(com.example.fashionshop.common.exception.UnauthorizedException.class,
                () -> service.updateMyAvatar(validPng()));
        verifyNoInteractions(storage);
    }

    @Test void cleanupFailureDoesNotUndoCommittedAvatarOrDeleteForeignKey() throws Exception {
        User user = login();
        user.setAvatarStorageKey("foreign-user-key");
        when(storage.store(any(), anyString(), anyInt()))
                .thenReturn(new AvatarStorageService.StoredAvatar("new-url", "fashionshop/avatars/4/new"));
        doThrow(new IllegalStateException("cleanup unavailable")).when(storage).delete("foreign-user-key");
        when(userRepository.save(user)).thenReturn(user);

        UserResponse response = service.updateMyAvatar(validPng());

        assertEquals("new-url", response.getAvatarUrl());
        assertEquals("fashionshop/avatars/4/new", user.getAvatarStorageKey());
        verify(storage, never()).delete("foreign-user-key");
    }

    @Test void ownedOldAssetCleanupFailureDoesNotRollbackCommittedAvatar() throws Exception {
        User user = login();
        user.setAvatarStorageKey("fashionshop/avatars/4/old");
        when(storage.store(any(), anyString(), anyInt()))
                .thenReturn(new AvatarStorageService.StoredAvatar("new-url", "fashionshop/avatars/4/new"));
        doThrow(new IllegalStateException("cleanup unavailable"))
                .when(storage).delete("fashionshop/avatars/4/old");
        when(userRepository.save(user)).thenReturn(user);

        UserResponse response = service.updateMyAvatar(validPng());

        assertEquals("new-url", response.getAvatarUrl());
        assertEquals("fashionshop/avatars/4/new", user.getAvatarStorageKey());
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
