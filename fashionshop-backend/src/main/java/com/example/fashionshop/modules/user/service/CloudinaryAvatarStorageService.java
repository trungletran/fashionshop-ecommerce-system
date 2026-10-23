package com.example.fashionshop.modules.user.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryAvatarStorageService implements AvatarStorageService {
    private final Cloudinary cloudinary;

    @Override
    @SuppressWarnings("unchecked")
    public StoredAvatar store(byte[] content, String contentType, Integer userId) throws IOException {
        Map<String, Object> result = cloudinary.uploader().upload(content, ObjectUtils.asMap(
                "folder", "fashionshop/avatars/" + userId,
                "resource_type", "image",
                "allowed_formats", new String[]{"jpg", "png"},
                "format", contentType.equals("image/png") ? "png" : "jpg"));
        return new StoredAvatar((String) result.get("secure_url"), (String) result.get("public_id"));
    }

    @Override
    public void delete(String storageKey) {
        try {
            cloudinary.uploader().destroy(storageKey, ObjectUtils.asMap("resource_type", "image"));
        } catch (Exception ignored) {
            // Cleanup is best-effort after the new avatar has been committed.
        }
    }
}
