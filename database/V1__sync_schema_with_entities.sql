-- ==============================================================================
-- Migration: V1__sync_schema_with_entities.sql
-- Description: Sync MySQL schema with JPA Entities across all domain modules
-- Compatible with MySQL 8.0, 8.4, 5.7 and MariaDB (No Error 1064)
-- ==============================================================================

-- 1. Table: banners (Create if not exists)
CREATE TABLE IF NOT EXISTS `banners` (
    `id` int NOT NULL AUTO_INCREMENT,
    `title` varchar(150) NOT NULL,
    `image_url` varchar(255) NOT NULL,
    `link_url` varchar(255) DEFAULT NULL,
    `display_order` int NOT NULL DEFAULT 0,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Helper procedure to safely add columns if they don't already exist in MySQL
DROP PROCEDURE IF EXISTS `AddColIfNotExists`;
DROP PROCEDURE IF EXISTS `AddIndexIfNotExists`;

DELIMITER $$

CREATE PROCEDURE `AddColIfNotExists`(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_column_def TEXT
)
BEGIN
    DECLARE col_count INT;
    SELECT COUNT(*) INTO col_count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND COLUMN_NAME = p_column_name;

    IF col_count = 0 THEN
        SET @stmt_sql = CONCAT('ALTER TABLE `', p_table_name, '` ADD COLUMN `', p_column_name, '` ', p_column_def);
        PREPARE dynamic_stmt FROM @stmt_sql;
        EXECUTE dynamic_stmt;
        DEALLOCATE PREPARE dynamic_stmt;
    END IF;
END$$

CREATE PROCEDURE `AddIndexIfNotExists`(
    IN p_table_name VARCHAR(64),
    IN p_index_name VARCHAR(64),
    IN p_index_def TEXT
)
BEGIN
    DECLARE idx_count INT;
    SELECT COUNT(*) INTO idx_count
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table_name
      AND INDEX_NAME = p_index_name;

    IF idx_count = 0 THEN
        SET @stmt_sql = CONCAT('ALTER TABLE `', p_table_name, '` ADD ', p_index_def);
        PREPARE dynamic_stmt FROM @stmt_sql;
        EXECUTE dynamic_stmt;
        DEALLOCATE PREPARE dynamic_stmt;
    END IF;
END$$

DELIMITER ;

-- 2. Table: users (Add missing profile and audit fields)
CALL AddColIfNotExists('users', 'phone_number', 'varchar(20) DEFAULT NULL');
CALL AddColIfNotExists('users', 'address', 'varchar(255) DEFAULT NULL');
CALL AddColIfNotExists('users', 'avatar_url', 'varchar(512) DEFAULT NULL');
CALL AddColIfNotExists('users', 'bio', 'varchar(500) DEFAULT NULL');
CALL AddColIfNotExists('users', 'account_status', "enum('ACTIVE', 'LOCKED', 'DELETED') NOT NULL DEFAULT 'ACTIVE'");
CALL AddColIfNotExists('users', 'managed_by', 'int DEFAULT NULL');

-- 3. Table: categories (Add description, image, status, audit fields)
CALL AddColIfNotExists('categories', 'description', 'text DEFAULT NULL');
CALL AddColIfNotExists('categories', 'image_url', 'varchar(255) DEFAULT NULL');
CALL AddColIfNotExists('categories', 'is_active', "tinyint(1) NOT NULL DEFAULT '1'");
CALL AddColIfNotExists('categories', 'created_by', 'int DEFAULT NULL');
CALL AddColIfNotExists('categories', 'created_at', 'timestamp NULL DEFAULT CURRENT_TIMESTAMP');

-- 4. Table: products (Add is_featured, audit fields)
CALL AddColIfNotExists('products', 'is_featured', "tinyint(1) NOT NULL DEFAULT '0'");
CALL AddColIfNotExists('products', 'created_by', 'int DEFAULT NULL');
CALL AddColIfNotExists('products', 'updated_by', 'int DEFAULT NULL');

-- 5. Table: carts (Add selected_payment_method)
CALL AddColIfNotExists('carts', 'selected_payment_method', 'varchar(30) DEFAULT NULL');

-- 6. Table: cart_items (Ensure Unique Constraint cart_id + product_id)
CALL AddIndexIfNotExists('cart_items', 'uk_cart_product', 'UNIQUE KEY `uk_cart_product` (`cart_id`, `product_id`)');

-- 7. Table: wishlists (Ensure Unique Constraint user_id + product_id)
CALL AddIndexIfNotExists('wishlists', 'uk_user_product', 'UNIQUE KEY `uk_user_product` (`user_id`, `product_id`)');

-- 8. Table: orders (Add customer_note, cancellation_reason, updated_at, managed_by)
CALL AddColIfNotExists('orders', 'customer_note', 'varchar(500) DEFAULT NULL');
CALL AddColIfNotExists('orders', 'cancellation_reason', 'varchar(500) DEFAULT NULL');
CALL AddColIfNotExists('orders', 'updated_at', 'timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
CALL AddColIfNotExists('orders', 'managed_by', 'int DEFAULT NULL');

-- 9. Table: payments (Add gateway details and timestamps)
CALL AddColIfNotExists('payments', 'gateway_transaction_id', 'varchar(100) DEFAULT NULL');
CALL AddColIfNotExists('payments', 'idempotency_key', 'varchar(128) DEFAULT NULL');
CALL AddColIfNotExists('payments', 'failure_reason', 'varchar(500) DEFAULT NULL');
CALL AddColIfNotExists('payments', 'paid_amount', 'decimal(12, 2) DEFAULT NULL');
CALL AddColIfNotExists('payments', 'transaction_reference', 'varchar(128) DEFAULT NULL');
CALL AddColIfNotExists('payments', 'gateway_provider', 'varchar(64) DEFAULT NULL');
CALL AddColIfNotExists('payments', 'created_at', 'timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL AddColIfNotExists('payments', 'updated_at', 'timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- Clean up helper procedures
DROP PROCEDURE IF EXISTS `AddColIfNotExists`;
DROP PROCEDURE IF EXISTS `AddIndexIfNotExists`;
