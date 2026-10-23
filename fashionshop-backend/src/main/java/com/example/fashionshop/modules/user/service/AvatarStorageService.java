package com.example.fashionshop.modules.user.service;

import java.io.IOException;

public interface AvatarStorageService {
    StoredAvatar store(byte[] content, String contentType, Integer userId) throws IOException;

    void delete(String storageKey);

    record StoredAvatar(String url, String storageKey) {}
}
