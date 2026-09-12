-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: ecommerce_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
    `id` int NOT NULL AUTO_INCREMENT,
    `full_name` varchar(100) NOT NULL,
    `email` varchar(100) NOT NULL,
    `password` varchar(255) NOT NULL,
    `phone_number` varchar(20) DEFAULT NULL,
    `address` varchar(255) DEFAULT NULL,
    `avatar_url` varchar(512) DEFAULT NULL,
    `bio` varchar(500) DEFAULT NULL,
    `role` enum('CUSTOMER', 'STAFF', 'ADMIN') DEFAULT 'CUSTOMER',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `account_status` enum('ACTIVE', 'LOCKED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `managed_by` int DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`),
    KEY `idx_users_managed_by` (`managed_by`),
    CONSTRAINT `users_ibfk_managed_by` FOREIGN KEY (`managed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `phone_number`, `address`, `avatar_url`, `bio`, `role`, `is_active`, `account_status`, `managed_by`, `created_at`)
VALUES 
    (1, 'Admin Account', 'admin@gmail.com', '$2a$10$64vTJyJT.oiP8EP0BZzeq.ZYvpNRs9/T2AQUkK2BrC8.kAR/4ZU9q', '0901234567', '123 Le Loi, District 1, HCMC', NULL, 'System Administrator', 'ADMIN', 1, 'ACTIVE', NULL, '2026-03-03 14:36:50'),
    (2, 'Staff Account', 'staff@gmail.com', '$2a$10$64vTJyJT.oiP8EP0BZzeq.ZYvpNRs9/T2AQUkK2BrC8.kAR/4ZU9q', '0912345678', '456 Nguyen Hue, District 1, HCMC', NULL, 'Operations Staff', 'STAFF', 1, 'ACTIVE', 1, '2026-03-03 14:36:50'),
    (3, 'Customer Account', 'customer@gmail.com', '$2a$10$64vTJyJT.oiP8EP0BZzeq.ZYvpNRs9/T2AQUkK2BrC8.kAR/4ZU9q', '0987654321', '789 Vo Van Tan, District 3, HCMC', NULL, 'Fashion Enthusiast', 'CUSTOMER', 1, 'ACTIVE', NULL, '2026-03-03 14:36:50');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `description` text DEFAULT NULL,
    `image_url` varchar(255) DEFAULT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `created_by` int DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_categories_created_by` (`created_by`),
    CONSTRAINT `categories_ibfk_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` (`id`, `name`, `description`, `image_url`, `is_active`, `created_by`, `created_at`)
VALUES 
    (1, 'T-Shirts', 'Comfortable cotton and casual t-shirts', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500', 1, 1, '2026-03-03 14:37:00'),
    (2, 'Jeans', 'Classic and slim fit denim jeans', 'https://images.unsplash.com/photo-1542272604-780c96856592?w=500', 1, 1, '2026-03-03 14:37:00'),
    (3, 'Jackets', 'Warm winter coats and stylish outerwear', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', 1, 1, '2026-03-03 14:37:00');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
    `id` int NOT NULL AUTO_INCREMENT,
    `category_id` int NOT NULL,
    `name` varchar(150) NOT NULL,
    `description` text,
    `price` decimal(10, 2) NOT NULL,
    `image_url` varchar(255) DEFAULT NULL,
    `stock_quantity` int NOT NULL DEFAULT '0',
    `is_active` tinyint(1) NOT NULL DEFAULT '1',
    `is_featured` tinyint(1) NOT NULL DEFAULT '0',
    `created_by` int DEFAULT NULL,
    `updated_by` int DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_products_category` (`category_id`),
    KEY `idx_products_created_by` (`created_by`),
    KEY `idx_products_updated_by` (`updated_by`),
    CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
    CONSTRAINT `products_ibfk_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `products_ibfk_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` (`id`, `category_id`, `name`, `description`, `price`, `image_url`, `stock_quantity`, `is_active`, `is_featured`, `created_by`, `updated_by`, `created_at`, `updated_at`)
VALUES 
    (1, 1, 'Basic White T-Shirt', '100% breathable organic cotton daily t-shirt', 19.99, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500', 50, 1, 1, 1, 1, '2026-03-03 14:37:08', '2026-03-03 14:37:08'),
    (2, 2, 'Slim Fit Jeans', 'Stretch blue denim with modern tapered silhouette', 49.99, 'https://images.unsplash.com/photo-1542272604-780c96856592?w=500', 30, 1, 1, 1, 1, '2026-03-03 14:37:08', '2026-03-03 14:37:08'),
    (3, 3, 'Winter Jacket', 'Waterproof insulated jacket with detachable hood', 89.99, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', 20, 1, 0, 1, 1, '2026-03-03 14:37:08', '2026-03-03 14:37:08');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners` (
    `id` int NOT NULL AUTO_INCREMENT,
    `title` varchar(150) NOT NULL,
    `image_url` varchar(255) NOT NULL,
    `link_url` varchar(255) DEFAULT NULL,
    `display_order` int NOT NULL DEFAULT 0,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` (`id`, `title`, `image_url`, `link_url`, `display_order`, `is_active`, `created_at`)
VALUES 
    (1, 'New Summer Collection 2026', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200', '/products', 1, 1, '2026-03-03 14:38:00'),
    (2, 'Exclusive Denim Weekend Sale', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200', '/products', 2, 1, '2026-03-03 14:38:00');
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL,
    `selected_payment_method` varchar(30) DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_id` (`user_id`),
    CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
    `id` int NOT NULL AUTO_INCREMENT,
    `cart_id` int NOT NULL,
    `product_id` int NOT NULL,
    `quantity` int NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_cart_product` (`cart_id`, `product_id`),
    KEY `idx_cart_items_cart` (`cart_id`),
    KEY `idx_cart_items_product` (`product_id`),
    CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlists`
--

DROP TABLE IF EXISTS `wishlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlists` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL,
    `product_id` int NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_product` (`user_id`, `product_id`),
    KEY `idx_wishlists_user` (`user_id`),
    KEY `idx_wishlists_product` (`product_id`),
    CONSTRAINT `wishlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `wishlists_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlists`
--

LOCK TABLES `wishlists` WRITE;
/*!40000 ALTER TABLE `wishlists` DISABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL,
    `status` enum(
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',
    `total_price` decimal(10, 2) DEFAULT NULL,
    `receiver_name` varchar(100) DEFAULT NULL,
    `phone` varchar(20) DEFAULT NULL,
    `shipping_address` varchar(255) DEFAULT NULL,
    `customer_note` varchar(500) DEFAULT NULL,
    `cancellation_reason` varchar(500) DEFAULT NULL,
    `managed_by` int DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_orders_user` (`user_id`),
    KEY `idx_orders_status` (`status`),
    KEY `idx_orders_managed_by` (`managed_by`),
    CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `orders_ibfk_managed_by` FOREIGN KEY (`managed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
    `id` int NOT NULL AUTO_INCREMENT,
    `order_id` int NOT NULL,
    `product_id` int NOT NULL,
    `quantity` int NOT NULL,
    `price` decimal(10, 2) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_order_items_order` (`order_id`),
    KEY `idx_order_items_product` (`product_id`),
    CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
    `id` int NOT NULL AUTO_INCREMENT,
    `order_id` int NOT NULL,
    `payment_method` enum(
        'COD',
        'BANKING',
        'MOMO',
        'VNPAY'
    ) NOT NULL,
    `payment_status` enum(
        'PENDING',
        'PROCESSING',
        'UNPAID',
        'PAID',
        'FAILED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',
    `gateway_transaction_id` varchar(100) DEFAULT NULL,
    `idempotency_key` varchar(128) DEFAULT NULL,
    `failure_reason` varchar(500) DEFAULT NULL,
    `paid_amount` decimal(12, 2) DEFAULT NULL,
    `transaction_reference` varchar(128) DEFAULT NULL,
    `gateway_provider` varchar(64) DEFAULT NULL,
    `paid_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_payments_order` (`order_id`),
    CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
    `id` int NOT NULL AUTO_INCREMENT,
    `order_id` int NOT NULL,
    `invoice_number` varchar(50) NOT NULL,
    `tax` decimal(10, 2) DEFAULT '0.00',
    `issued_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `note` text,
    `total_amount` decimal(10, 2) NOT NULL DEFAULT '0.00',
    `payment_status` enum(
        'PENDING',
        'PAID',
        'FAILED',
        'REFUNDED'
    ) NOT NULL DEFAULT 'PENDING',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_invoices_order` (`order_id`),
    UNIQUE KEY `uk_invoices_number` (`invoice_number`),
    CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-12 15:41:00