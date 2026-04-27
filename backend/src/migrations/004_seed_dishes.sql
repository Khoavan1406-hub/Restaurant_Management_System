-- =============================================
-- Migration 004: Seed dishes (25 dishes, 6 categories)
-- Synchronize dish data to match the canonical menu.
-- =============================================

DROP TEMPORARY TABLE IF EXISTS `tmp_seed_dish`;

CREATE TEMPORARY TABLE `tmp_seed_dish` (
    `chefID`          INT             NULL,
    `name`            VARCHAR(100)    NOT NULL,
    `description`     TEXT            NULL,
    `image_url`       VARCHAR(500)    NULL,
    `category`        VARCHAR(50)     NOT NULL,
    `price`           DECIMAL(12, 2)  NOT NULL,
    `daily_portion`   INT             NOT NULL,
    `current_portion` INT             NOT NULL,
    `is_available`    BOOLEAN         NOT NULL
);

INSERT INTO `tmp_seed_dish` (
    `chefID`,
    `name`,
    `description`,
    `image_url`,
    `category`,
    `price`,
    `daily_portion`,
    `current_portion`,
    `is_available`
) VALUES
    (IF(EXISTS(SELECT 1 FROM `Chef` WHERE `userID` = 4), 4, NULL), 'Pho', 'Vietnamese Pho', NULL, 'Main', 50000.00, 10, 10, TRUE),
    (NULL, 'Spring Rolls', 'Crispy fried spring rolls with mixed vegetables.', NULL, 'Appetizer', 45000.00, 40, 40, TRUE),
    (NULL, 'Garlic Bread', 'Toasted bread with garlic butter and herbs.', NULL, 'Appetizer', 40000.00, 35, 35, TRUE),
    (NULL, 'Caesar Salad', 'Romaine lettuce, croutons, parmesan, and Caesar dressing.', NULL, 'Appetizer', 52000.00, 30, 30, TRUE),
    (NULL, 'Chicken Wings', 'Spicy glazed chicken wings served hot.', NULL, 'Appetizer', 70000.00, 30, 30, TRUE),
    (NULL, 'Tomato Soup', 'Creamy tomato soup with basil.', NULL, 'Soup', 42000.00, 25, 25, TRUE),
    (NULL, 'Mushroom Soup', 'Rich mushroom soup with black pepper.', NULL, 'Soup', 44000.00, 25, 25, TRUE),
    (NULL, 'Hot and Sour Soup', 'Tangy soup with tofu and mushrooms.', NULL, 'Soup', 48000.00, 25, 25, TRUE),
    (NULL, 'Pumpkin Soup', 'Velvety pumpkin soup with cream.', NULL, 'Soup', 46000.00, 20, 20, TRUE),
    (NULL, 'Grilled Salmon', 'Salmon fillet grilled with lemon butter sauce.', NULL, 'Main Course', 149000.00, 20, 20, TRUE),
    (NULL, 'Beef Steak', 'Pan-seared beef steak with pepper sauce.', NULL, 'Main Course', 165000.00, 18, 18, TRUE),
    (NULL, 'Roast Chicken', 'Herb-marinated roasted chicken.', NULL, 'Main Course', 129000.00, 22, 22, TRUE),
    (NULL, 'Vegetable Curry', 'Seasonal vegetables cooked in mild curry.', NULL, 'Main Course', 102000.00, 24, 24, TRUE),
    (NULL, 'Chicken Fried Rice', 'Wok-fried rice with chicken, egg, and vegetables.', NULL, 'Noodles & Rice', 84000.00, 35, 35, TRUE),
    (NULL, 'Seafood Fried Rice', 'Fried rice with shrimp, squid, and fish sauce.', NULL, 'Noodles & Rice', 92000.00, 30, 30, TRUE),
    (NULL, 'Pad Thai', 'Rice noodles stir-fried with tamarind sauce.', NULL, 'Noodles & Rice', 89000.00, 30, 30, TRUE),
    (NULL, 'Beef Udon', 'Udon noodles with sliced beef and broth.', NULL, 'Noodles & Rice', 96000.00, 28, 28, TRUE),
    (NULL, 'Chocolate Lava Cake', 'Warm chocolate cake with molten center.', NULL, 'Dessert', 59000.00, 20, 20, TRUE),
    (NULL, 'Tiramisu', 'Classic coffee-flavored Italian dessert.', NULL, 'Dessert', 57000.00, 20, 20, TRUE),
    (NULL, 'Mango Sticky Rice', 'Sweet sticky rice with ripe mango and coconut cream.', NULL, 'Dessert', 54000.00, 22, 22, TRUE),
    (NULL, 'Cheesecake', 'Baked cheesecake with berry topping.', NULL, 'Dessert', 60000.00, 20, 20, TRUE),
    (NULL, 'Lemon Iced Tea', 'Freshly brewed tea with lemon and ice.', NULL, 'Beverage', 28000.00, 60, 60, TRUE),
    (NULL, 'Fresh Orange Juice', 'Cold-pressed orange juice.', NULL, 'Beverage', 34000.00, 50, 50, TRUE),
    (NULL, 'Cappuccino', 'Espresso with steamed milk foam.', NULL, 'Beverage', 36000.00, 40, 40, TRUE),
    (NULL, 'Mineral Water', 'Chilled bottled mineral water.', NULL, 'Beverage', 15000.00, 100, 100, TRUE);

-- Insert dishes that are missing (match by name)
INSERT INTO `Dish` (
    `chefID`,
    `name`,
    `description`,
    `image_url`,
    `category`,
    `price`,
    `daily_portion`,
    `current_portion`,
    `is_available`
)
SELECT
    s.`chefID`,
    s.`name`,
    s.`description`,
    s.`image_url`,
    s.`category`,
    s.`price`,
    s.`daily_portion`,
    s.`current_portion`,
    s.`is_available`
FROM `tmp_seed_dish` s
LEFT JOIN `Dish` d ON d.`name` = s.`name`
WHERE d.`dishID` IS NULL;

-- Sync existing dish rows to canonical values (match by name)
UPDATE `Dish` d
INNER JOIN `tmp_seed_dish` s ON d.`name` = s.`name`
SET
    d.`chefID` = s.`chefID`,
    d.`description` = s.`description`,
    d.`image_url` = s.`image_url`,
    d.`category` = s.`category`,
    d.`price` = s.`price`,
    d.`daily_portion` = s.`daily_portion`,
    d.`current_portion` = s.`current_portion`,
    d.`is_available` = s.`is_available`;

DROP TEMPORARY TABLE IF EXISTS `tmp_seed_dish`;
