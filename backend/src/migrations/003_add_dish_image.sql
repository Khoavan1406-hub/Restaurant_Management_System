-- Migration 003: Add image_url column to Dish table
ALTER TABLE `Dish` ADD COLUMN `image_url` VARCHAR(500) NULL AFTER `description`;
