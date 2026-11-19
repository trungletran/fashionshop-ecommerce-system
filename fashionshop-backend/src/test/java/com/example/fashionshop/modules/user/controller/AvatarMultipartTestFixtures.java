package com.example.fashionshop.modules.user.controller;

import org.springframework.mock.web.MockMultipartFile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;

final class AvatarMultipartTestFixtures {
    private AvatarMultipartTestFixtures() { }

    static MockMultipartFile file(String name, byte[] content) {
        return new MockMultipartFile("file", name, "image/png", content);
    }

    static org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder request(
            MockMultipartFile... files) {
        var request = multipart("/api/me/avatar");
        for (MockMultipartFile file : files) {
            request.file(file);
        }
        return request;
    }
}
