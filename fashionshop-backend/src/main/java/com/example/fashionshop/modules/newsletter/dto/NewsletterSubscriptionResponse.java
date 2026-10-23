package com.example.fashionshop.modules.newsletter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsletterSubscriptionResponse {
    private Integer id;
    private String email;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
