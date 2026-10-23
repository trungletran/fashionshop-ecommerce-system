package com.example.fashionshop.modules.newsletter.service;

import com.example.fashionshop.modules.newsletter.dto.NewsletterSubscribeRequest;
import com.example.fashionshop.modules.newsletter.dto.NewsletterSubscriptionResponse;

public interface NewsletterService {
    NewsletterSubscriptionResponse subscribe(NewsletterSubscribeRequest request);
}
