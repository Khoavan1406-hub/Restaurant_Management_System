-- =============================================
-- Restaurant Management System
-- Migration 002: Seed default user accounts
-- =============================================
-- admin   | password: admin123
-- waiter1 | password: waiter1123
-- waiter2 | password: waiter2123
-- chef1   | password: chef1123
-- chef2   | password: chef2123
-- =============================================

-- ----- Admin -----
INSERT INTO `User` (`id_number`, `username`, `passwordHash`, `phone_number`, `contact_email`, `role`, `is_active`)
VALUES ('123456789012', 'admin', '$2b$10$J99G2V2tEYwjSFO1/jouMe/9GXsUaIhvMvHPz0Y4eUe4KeIs8TLzm', '0000000000', 'admin@restaurant.com', 'Admin', FALSE);

INSERT INTO `Admin` (`userID`) VALUES (LAST_INSERT_ID());

-- ----- Waiter 1 -----
INSERT INTO `User` (`id_number`, `username`, `passwordHash`, `phone_number`, `contact_email`, `role`, `is_active`)
VALUES ('123456789013', 'waiter1', '$2b$10$tDaie8dhFOA8kksR0LUpn.KS.QbfXNM9V..i.SDkDAujVDMKWzFJS', '0111111111', 'waiter1@restaurant.com', 'Waiter', FALSE);

INSERT INTO `Waiter` (`userID`) VALUES (LAST_INSERT_ID());

-- ----- Waiter 2 -----
INSERT INTO `User` (`id_number`, `username`, `passwordHash`, `phone_number`, `contact_email`, `role`, `is_active`)
VALUES ('123456789014', 'waiter2', '$2b$10$3PY0R9b9zlhxYji2kwlek.Gp9Mc23rTPXrH.Dxo44B2MAJWFgbfQK', '0222222222', 'waiter2@restaurant.com', 'Waiter', FALSE);

INSERT INTO `Waiter` (`userID`) VALUES (LAST_INSERT_ID());

-- ----- Chef 1 -----
INSERT INTO `User` (`id_number`, `username`, `passwordHash`, `phone_number`, `contact_email`, `role`, `is_active`)
VALUES ('123456789015', 'chef1', '$2b$10$RbDajPmEgfoynOY7LJuVhehgSlOhQ5EiXy3O5C3e0xl1jr8BYuSc2', '0333333333', 'chef1@restaurant.com', 'Chef', FALSE);

INSERT INTO `Chef` (`userID`) VALUES (LAST_INSERT_ID());

-- ----- Chef 2 -----
INSERT INTO `User` (`id_number`, `username`, `passwordHash`, `phone_number`, `contact_email`, `role`, `is_active`)
VALUES ('123456789016', 'chef2', '$2b$10$SKIoi9myeis20wp4Qh/M4uHXHhsQ5PHYmHiUOVTZ2aedQovgiVlX6', '0444444444', 'chef2@restaurant.com', 'Chef', FALSE);

INSERT INTO `Chef` (`userID`) VALUES (LAST_INSERT_ID());
