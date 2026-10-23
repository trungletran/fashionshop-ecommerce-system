-- Migration: V2__create_newsletter_subscriptions_table.sql
-- Description: Add newsletter_subscriptions table for guest/user email subscription storage
-- Compatible with MySQL 8.x

CREATE TABLE IF NOT EXISTS `newsletter_subscriptions` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_newsletter_email` (`email`),
    KEY `idx_newsletter_created_at` (`created_at`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
