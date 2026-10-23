package com.example.fashionshop.modules.newsletter.service;

import com.example.fashionshop.common.exception.DuplicateSubscriptionException;
import com.example.fashionshop.modules.newsletter.dto.NewsletterSubscribeRequest;
import com.example.fashionshop.modules.newsletter.dto.NewsletterSubscriptionResponse;
import com.example.fashionshop.modules.newsletter.entity.NewsletterSubscription;
import com.example.fashionshop.modules.newsletter.repository.NewsletterSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class NewsletterServiceImpl implements NewsletterService {

    private static final Logger log = LoggerFactory.getLogger(NewsletterServiceImpl.class);

    private final NewsletterSubscriptionRepository subscriptionRepository;

    @Override
    @Transactional
    public NewsletterSubscriptionResponse subscribe(NewsletterSubscribeRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

        if (subscriptionRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            // Note: Do not log the raw email address for privacy/compliance
            log.warn("Newsletter subscription rejected: duplicate email detected");
            throw new DuplicateSubscriptionException("This email is already subscribed to our newsletter");
        }

        NewsletterSubscription entity = NewsletterSubscription.builder()
                .email(normalizedEmail)
                .isActive(true)
                .build();

        NewsletterSubscription saved = subscriptionRepository.save(entity);
        log.info("Newsletter subscription created successfully with id={}", saved.getId());

        return NewsletterSubscriptionResponse.builder()
                .id(saved.getId())
                .email(saved.getEmail())
                .isActive(saved.getIsActive())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
