package com.example.fashionshop.modules.newsletter.service;

import com.example.fashionshop.common.exception.DuplicateSubscriptionException;
import com.example.fashionshop.modules.newsletter.dto.NewsletterSubscribeRequest;
import com.example.fashionshop.modules.newsletter.dto.NewsletterSubscriptionResponse;
import com.example.fashionshop.modules.newsletter.entity.NewsletterSubscription;
import com.example.fashionshop.modules.newsletter.repository.NewsletterSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NewsletterServiceTest {

    @Mock
    private NewsletterSubscriptionRepository subscriptionRepository;

    @InjectMocks
    private NewsletterServiceImpl newsletterService;

    private NewsletterSubscribeRequest request;

    @BeforeEach
    void setUp() {
        request = NewsletterSubscribeRequest.builder()
                .email("User@Example.Com ")
                .build();
    }

    @Test
    void subscribe_shouldSaveNormalizedEmailSuccessfully() {
        when(subscriptionRepository.existsByEmailIgnoreCase("user@example.com")).thenReturn(false);

        NewsletterSubscription savedEntity = NewsletterSubscription.builder()
                .id(1)
                .email("user@example.com")
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(subscriptionRepository.save(any(NewsletterSubscription.class))).thenReturn(savedEntity);

        NewsletterSubscriptionResponse response = newsletterService.subscribe(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1);
        assertThat(response.getEmail()).isEqualTo("user@example.com");
        assertThat(response.getIsActive()).isTrue();

        ArgumentCaptor<NewsletterSubscription> captor = ArgumentCaptor.forClass(NewsletterSubscription.class);
        verify(subscriptionRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo("user@example.com");
    }

    @Test
    void subscribe_shouldThrowDuplicateSubscriptionException_whenEmailAlreadyExists() {
        when(subscriptionRepository.existsByEmailIgnoreCase("user@example.com")).thenReturn(true);

        assertThatThrownBy(() -> newsletterService.subscribe(request))
                .isInstanceOf(DuplicateSubscriptionException.class)
                .hasMessage("This email is already subscribed to our newsletter");

        verify(subscriptionRepository, never()).save(any());
    }
}
