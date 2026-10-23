package com.example.fashionshop.modules.newsletter.controller;

import com.example.fashionshop.common.exception.DuplicateSubscriptionException;
import com.example.fashionshop.common.exception.GlobalExceptionHandler;
import com.example.fashionshop.config.TestSecurityConfig;
import com.example.fashionshop.modules.newsletter.dto.NewsletterSubscriptionResponse;
import com.example.fashionshop.modules.newsletter.service.NewsletterService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NewsletterController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({GlobalExceptionHandler.class, TestSecurityConfig.class})
class NewsletterControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NewsletterService newsletterService;

    @Test
    void subscribe_shouldReturn201WhenValidEmailProvided() throws Exception {
        NewsletterSubscriptionResponse response = NewsletterSubscriptionResponse.builder()
                .id(1)
                .email("test@example.com")
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(newsletterService.subscribe(any())).thenReturn(response);

        mockMvc.perform(post("/api/newsletter/subscribe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "test@example.com"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Thank you for subscribing to our newsletter"))
                .andExpect(jsonPath("$.data.email").value("test@example.com"));
    }

    @Test
    void subscribe_shouldReturn400WhenEmailIsInvalid() throws Exception {
        mockMvc.perform(post("/api/newsletter/subscribe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "not-a-valid-email"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void subscribe_shouldReturn400WhenEmailIsBlank() throws Exception {
        mockMvc.perform(post("/api/newsletter/subscribe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": ""
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void subscribe_shouldReturn409WhenDuplicateEmail() throws Exception {
        when(newsletterService.subscribe(any()))
                .thenThrow(new DuplicateSubscriptionException("This email is already subscribed to our newsletter"));

        mockMvc.perform(post("/api/newsletter/subscribe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "duplicate@example.com"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"))
                .andExpect(jsonPath("$.message").value("This email is already subscribed to our newsletter"));
    }
}
