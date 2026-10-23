package com.example.fashionshop.modules.newsletter.repository;

import com.example.fashionshop.modules.newsletter.entity.NewsletterSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NewsletterSubscriptionRepository extends JpaRepository<NewsletterSubscription, Integer> {
    boolean existsByEmailIgnoreCase(String email);

    Optional<NewsletterSubscription> findByEmailIgnoreCase(String email);
}
