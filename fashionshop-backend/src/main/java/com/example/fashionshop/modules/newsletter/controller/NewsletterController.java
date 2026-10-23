package com.example.fashionshop.modules.newsletter.controller;

import com.example.fashionshop.common.response.ApiResponse;
import com.example.fashionshop.modules.newsletter.dto.NewsletterSubscribeRequest;
import com.example.fashionshop.modules.newsletter.dto.NewsletterSubscriptionResponse;
import com.example.fashionshop.modules.newsletter.service.NewsletterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/newsletter")
@RequiredArgsConstructor
public class NewsletterController {

    private final NewsletterService newsletterService;

    @PostMapping(value = {"", "/subscribe"})
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<NewsletterSubscriptionResponse> subscribe(@Valid @RequestBody NewsletterSubscribeRequest request) {
        NewsletterSubscriptionResponse response = newsletterService.subscribe(request);
        return ApiResponse.success("Thank you for subscribing to our newsletter", response);
    }
}
