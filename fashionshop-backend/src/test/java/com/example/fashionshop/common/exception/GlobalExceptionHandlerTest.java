package com.example.fashionshop.common.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class GlobalExceptionHandlerTest {
    @Test
    void mapsMultipartSizeFailureToAvatarApiError() {
        var response = new GlobalExceptionHandler().handleMaxUploadSize(
                new MaxUploadSizeExceededException(5_242_880L));

        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("AVATAR_FILE_TOO_LARGE", response.getBody().getCode());
        assertEquals("Image must be 5 MiB or smaller", response.getBody().getMessage());
    }

    @Test
    void mapsUnsupportedMediaTypeWithoutInternalLeak() {
        var response = new GlobalExceptionHandler().handleUnsupportedMediaType(
                new HttpMediaTypeNotSupportedException("application/json not supported"));

        assertEquals(HttpStatus.UNSUPPORTED_MEDIA_TYPE, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("UNSUPPORTED_MEDIA_TYPE", response.getBody().getCode());
        assertEquals("Unsupported content type", response.getBody().getMessage());
    }

    @Test
    void mapsMalformedMultipartToBadRequestWithoutInternalLeak() {
        var response = new GlobalExceptionHandler().handleMultipart(
                new MultipartException("internal boundary parse detail"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("AVATAR_INVALID_IMAGE", response.getBody().getCode());
        assertEquals("Invalid multipart upload request", response.getBody().getMessage());
    }
}
