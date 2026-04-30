-- =============================================
-- Restaurant Management System - Database Schema
-- Migration 001: Initial Schema
-- =============================================

-- 1. User Table
CREATE TABLE IF NOT EXISTS `User` (
    `userID`        INT             AUTO_INCREMENT PRIMARY KEY,
    `id_number`     VARCHAR(20)     NOT NULL UNIQUE,
    `username`      VARCHAR(50)     NOT NULL UNIQUE,
    `passwordHash`  VARCHAR(255)    NOT NULL,
    `phone_number`  VARCHAR(15)     NULL,
    `contact_email` VARCHAR(100)    NULL,
    `role`          ENUM('Admin', 'Chef', 'Waiter') NOT NULL,
    `is_active`     BOOLEAN         DEFAULT FALSE,
    `created_at`    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Admin Table (Inherit from User)
CREATE TABLE IF NOT EXISTS `Admin` (
    `userID`    INT PRIMARY KEY,
    CONSTRAINT `fk_admin_user`
        FOREIGN KEY (`userID`) REFERENCES `User`(`userID`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Chef Table (Inherit from User)
CREATE TABLE IF NOT EXISTS `Chef` (
    `userID`    INT PRIMARY KEY,
    CONSTRAINT `fk_chef_user`
        FOREIGN KEY (`userID`) REFERENCES `User`(`userID`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Waiter Table (Inherit from User)
CREATE TABLE IF NOT EXISTS `Waiter` (
    `userID`    INT PRIMARY KEY,
    CONSTRAINT `fk_waiter_user`
        FOREIGN KEY (`userID`) REFERENCES `User`(`userID`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Dish Table
CREATE TABLE IF NOT EXISTS `Dish` (
    `dishID`          INT             AUTO_INCREMENT PRIMARY KEY,
    `chefID`          INT             NULL,
    `name`            VARCHAR(100)    NOT NULL,
    `description`     TEXT            NULL,
    `note`            TEXT            NULL,
    `image_url`       VARCHAR(500)    NULL,
    `category`        VARCHAR(50)     NOT NULL,
    `price`           DECIMAL(12, 2)  NOT NULL CHECK (`price` >= 0),
    `daily_portion`   INT             NOT NULL DEFAULT 0,
    `current_portion` INT             NOT NULL DEFAULT 0,
    `is_available`    BOOLEAN         DEFAULT TRUE,
    CONSTRAINT `fk_dish_chef`
        FOREIGN KEY (`chefID`) REFERENCES `Chef`(`userID`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TableSession Table
CREATE TABLE IF NOT EXISTS `TableSession` (
    `sessionID`    INT             AUTO_INCREMENT PRIMARY KEY,
    `waiterID`     INT             NOT NULL,
    `table_number` INT             NOT NULL,
    `start_time`   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    `end_time`     TIMESTAMP       NULL,
    `status`       ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active',
    `total_bill`   DECIMAL(12, 2)  DEFAULT 0.00,
    CONSTRAINT `fk_session_waiter`
        FOREIGN KEY (`waiterID`) REFERENCES `Waiter`(`userID`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Order Table
CREATE TABLE IF NOT EXISTS `Order` (
    `orderID`    INT         AUTO_INCREMENT PRIMARY KEY,
    `sessionID`  INT         NOT NULL,
    `waiterID`   INT         NOT NULL,
    `chefID`     INT         NULL,
    `timestamp`  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    `status`     ENUM('Not Started', 'Cooking', 'Ready', 'Completed', 'Cancelled') DEFAULT 'Not Started',
    CONSTRAINT `fk_order_session`
        FOREIGN KEY (`sessionID`) REFERENCES `TableSession`(`sessionID`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_order_waiter`
        FOREIGN KEY (`waiterID`) REFERENCES `Waiter`(`userID`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_order_chef`
        FOREIGN KEY (`chefID`) REFERENCES `Chef`(`userID`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. OrderItem Table
CREATE TABLE IF NOT EXISTS `OrderItem` (
    `itemID`       INT          AUTO_INCREMENT PRIMARY KEY,
    `orderID`      INT          NOT NULL,
    `dishID`       INT          NOT NULL,
    `quantity`     INT          NOT NULL CHECK (`quantity` > 0),
    `special_note` TEXT         NULL,
    CONSTRAINT `fk_item_order`
        FOREIGN KEY (`orderID`) REFERENCES `Order`(`orderID`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_item_dish`
        FOREIGN KEY (`dishID`) REFERENCES `Dish`(`dishID`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. AuditLog Table
CREATE TABLE IF NOT EXISTS `AuditLog` (
    `logID`     INT          AUTO_INCREMENT PRIMARY KEY,
    `userID`    INT          NULL,
    `action`    TEXT         NOT NULL,
    `timestamp` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_log_user`
        FOREIGN KEY (`userID`) REFERENCES `User`(`userID`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Indexes for query performance
-- =============================================
CREATE INDEX idx_user_role        ON `User`(`role`);
CREATE INDEX idx_user_username    ON `User`(`username`);
CREATE INDEX idx_dish_category    ON `Dish`(`category`);
CREATE INDEX idx_dish_available   ON `Dish`(`is_available`);
CREATE INDEX idx_session_status   ON `TableSession`(`status`);
CREATE INDEX idx_session_waiter   ON `TableSession`(`waiterID`);
CREATE INDEX idx_order_status     ON `Order`(`status`);
CREATE INDEX idx_order_session    ON `Order`(`sessionID`);
CREATE INDEX idx_orderitem_order  ON `OrderItem`(`orderID`);
CREATE INDEX idx_auditlog_user    ON `AuditLog`(`userID`);
CREATE INDEX idx_auditlog_time    ON `AuditLog`(`timestamp`);
