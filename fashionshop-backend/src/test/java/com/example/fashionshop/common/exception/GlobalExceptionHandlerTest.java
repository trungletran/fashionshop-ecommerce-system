package com.example.fashionshop.common.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {
    @Test
    void mapsMultipartSizeFailureToAvatarApiError() {
        var response = new GlobalExceptionHandler().handleMaxUploadSize(
                new MaxUploadSizeExceededException(5_242_880L));

        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, response.getStatusCode());
        assertEquals("AVATAR_FILE_TOO_LARGE", response.getBody().getCode());
        assertEquals("Image must be 5 MiB or smaller", response.getBody().getMessage());
    }
}
