-- =============================================
-- Migration 004: Seed dishes (25 dishes, 6 categories)
-- Synchronize dish data to match the canonical menu.
-- =============================================

DROP TEMPORARY TABLE IF EXISTS `tmp_seed_dish`;

CREATE TEMPORARY TABLE `tmp_seed_dish` (
    `chefID`          INT             NULL,
    `name`            VARCHAR(100)    NOT NULL,
    `description`     TEXT            NULL,
    `note`            TEXT            NULL,
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
    `note`,
    `image_url`,
    `category`,
    `price`,
    `daily_portion`,
    `current_portion`,
    `is_available`
) VALUES
    (4, 'Pho', 'Vietnamese Pho', NULL, 'https://phocity.com/cdn/shop/files/8dd641cd6289c5d79c98.jpg?v=1724719244&width=1200', 'Main Course', 50000.00, 10, 10, TRUE),
    (4, 'Spring Rolls', 'Crispy fried spring rolls with mixed vegetables.', NULL, 'https://tastymealsblog.net/wp-content/uploads/2025/03/recipe_image_0_20250312_011430.jpg', 'Appetizer', 45000.00, 40, 40, TRUE),
    (4, 'Garlic Bread', 'Toasted bread with garlic butter and herbs.', NULL, 'https://www.gonnawantseconds.com/wp-content/uploads/1990/01/Garlic-Bread-3.jpg', 'Appetizer', 40000.00, 35, 35, TRUE),
    (4, 'Caesar Salad', 'Romaine lettuce, croutons, parmesan, and Caesar dressing.', 'Contains dairy', 'https://recipesbyclare.com/assets/images/1744736617910-kp8i3iu0.webp', 'Appetizer', 52000.00, 30, 30, TRUE),
    (4, 'Chicken Wings', 'Spicy glazed chicken wings served hot.', NULL, 'https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fit,w_730,h_552/k%2FPhoto%2FRecipes%2F2025-01-cowboy-butter-wings%2Fcowboy-butter-chicken-wings-0795_1c30c6-crop', 'Appetizer', 70000.00, 30, 30, TRUE),
    (4, 'Tomato Soup', 'Creamy tomato soup with basil.', NULL, 'https://tomatoabout.com/wp-content/uploads/2025/05/create_a_warm_comforting_image_that_features_a_creamy_tomato_soup_served_in_a_rustieramic_bowl_t_6a157uaulzvipkw0hvpe_0-1-768x841.webp', 'Soup', 42000.00, 25, 25, TRUE),
    (4, 'Mushroom Soup', 'Rich mushroom soup with black pepper.', NULL, 'https://ladyrecipes.com/wp-content/uploads/2024/11/creamy-mushroom-soup.jpg', 'Soup', 44000.00, 25, 25, TRUE),
    (4, 'Hot and Sour Soup', 'Tangy soup with tofu and mushrooms.', NULL, 'https://tse4.mm.bing.net/th/id/OIP.ZP1_hh2cigxPrzlME-ic8QHaLG?rs=1&pid=ImgDetMain&o=7&rm=3', 'Soup', 48000.00, 25, 25, TRUE),
    (4, 'Pumpkin Soup', 'Velvety pumpkin soup with cream.', NULL, 'https://tse3.mm.bing.net/th/id/OIP.LGfxioiVAI-FaCSPflDoTQHaHa?w=500&h=500&rs=1&pid=ImgDetMain&o=7&rm=3', 'Soup', 46000.00, 20, 20, TRUE),
    (4, 'Grilled Salmon', 'Salmon fillet grilled with lemon butter sauce.', NULL, NULL, 'Main Course', 149000.00, 20, 20, TRUE),
    (4, 'Beef Steak', 'Pan-seared beef steak with pepper sauce.', 'Ready to serve in 15 minutes', NULL, 'Main Course', 165000.00, 18, 18, TRUE),
    (4, 'Roast Chicken', 'Herb-marinated roasted chicken.', NULL, NULL, 'Main Course', 129000.00, 22, 22, TRUE),
    (4, 'Vegetable Curry', 'Seasonal vegetables cooked in mild curry.', NULL, NULL, 'Main Course', 102000.00, 24, 24, TRUE),
    (4, 'Chicken Fried Rice', 'Wok-fried rice with chicken, egg, and vegetables.', NULL, NULL, 'Noodles & Rice', 84000.00, 35, 35, TRUE),
    (4, 'Seafood Fried Rice', 'Fried rice with shrimp, squid, and fish sauce.', NULL, NULL, 'Noodles & Rice', 92000.00, 30, 30, TRUE),
    (4, 'Pad Thai', 'Rice noodles stir-fried with tamarind sauce.', NULL, NULL, 'Noodles & Rice', 89000.00, 30, 30, TRUE),
    (4, 'Beef Udon', 'Udon noodles with sliced beef and broth.', NULL, NULL, 'Noodles & Rice', 96000.00, 28, 28, TRUE),
    (4, 'Chocolate Lava Cake', 'Warm chocolate cake with molten center.', NULL, NULL, 'Dessert', 59000.00, 20, 20, TRUE),
    (4, 'Tiramisu', 'Classic coffee-flavored Italian dessert.', NULL, NULL, 'Dessert', 57000.00, 20, 20, TRUE),
    (4, 'Mango Sticky Rice', 'Sweet sticky rice with ripe mango and coconut cream.', NULL, NULL, 'Dessert', 54000.00, 22, 22, TRUE),
    (4, 'Cheesecake', 'Baked cheesecake with berry topping.', NULL, NULL, 'Dessert', 60000.00, 20, 20, TRUE),
    (4, 'Lemon Iced Tea', 'Freshly brewed tea with lemon and ice.', NULL, NULL, 'Beverage', 28000.00, 60, 60, TRUE),
    (4, 'Fresh Orange Juice', 'Cold-pressed orange juice.', NULL, NULL, 'Beverage', 34000.00, 50, 50, TRUE),
    (4, 'Cappuccino', 'Espresso with steamed milk foam.', NULL, NULL, 'Beverage', 36000.00, 40, 40, TRUE),
    (4, 'Mineral Water', 'Chilled bottled mineral water.', NULL, NULL, 'Beverage', 15000.00, 100, 100, TRUE);

-- Insert dishes that are missing (match by name)
INSERT INTO `Dish` (
    `chefID`,
    `name`,
    `description`,
    `note`,
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
    s.`note`,
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
    d.`note` = s.`note`,
    d.`image_url` = s.`image_url`,
    d.`category` = s.`category`,
    d.`price` = s.`price`,
    d.`daily_portion` = s.`daily_portion`,
    d.`current_portion` = s.`current_portion`,
    d.`is_available` = s.`is_available`;

DROP TEMPORARY TABLE IF EXISTS `tmp_seed_dish`;
