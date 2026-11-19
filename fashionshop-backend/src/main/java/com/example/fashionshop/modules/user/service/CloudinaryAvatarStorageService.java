package com.example.fashionshop.modules.user.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryAvatarStorageService implements AvatarStorageService {
    private final Cloudinary cloudinary;

    @Override
    @SuppressWarnings("unchecked")
    public StoredAvatar store(byte[] content, String contentType, Integer userId) throws IOException {
        if (!StringUtils.hasText(cloudinary.config.cloudName)
                || !StringUtils.hasText(cloudinary.config.apiKey)
                || !StringUtils.hasText(cloudinary.config.apiSecret)) {
            throw new IllegalStateException("Cloudinary credentials are not configured");
        }
        Map<String, Object> result = cloudinary.uploader().upload(content, ObjectUtils.asMap(
                "folder", "fashionshop/avatars/" + userId,
                "resource_type", "image",
                "allowed_formats", new String[]{"jpg", "png"},
                "format", "image/png".equals(contentType) ? "png" : "jpg"));
        String secureUrl = result != null ? (String) result.get("secure_url") : null;
        String publicId = result != null ? (String) result.get("public_id") : null;
        if (!StringUtils.hasText(secureUrl) || !StringUtils.hasText(publicId)) {
            throw new IOException("Cloudinary response missing secure_url or public_id");
        }
        return new StoredAvatar(secureUrl, publicId);
    }

    @Override
    public void delete(String storageKey) {
        if (!StringUtils.hasText(storageKey)) {
            return;
        }
        try {
            cloudinary.uploader().destroy(storageKey, ObjectUtils.asMap("resource_type", "image"));
        } catch (Exception ex) {
            log.warn("Best-effort Cloudinary avatar cleanup failed for key {}: {}", storageKey, ex.getMessage());
        }
    }
}
