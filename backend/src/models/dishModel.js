const { pool } = require("../config/db");

const findAll = async () => {
  const [rows] = await pool.execute(
    "SELECT * FROM `Dish` WHERE `is_available` = TRUE ORDER BY `category`, `name`"
  );
  return rows;
};

const findAllForChef = async () => {
  const [rows] = await pool.execute(
    "SELECT * FROM `Dish` ORDER BY `category`, `name`"
  );
  return rows;
};

const findById = async (dishID) => {
  const [rows] = await pool.execute(
    "SELECT * FROM `Dish` WHERE `dishID` = ?",
    [dishID]
  );
  return rows[0];
};

const create = async ({ chefID, name, description, note, image_url, category, price, daily_portion }) => {
  const [result] = await pool.execute(
    "INSERT INTO `Dish` (`chefID`, `name`, `description`, `note`, `image_url`, `category`, `price`, `daily_portion`, `current_portion`, `is_available`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)",
    [chefID, name, description || null, note || null, image_url || null, category, price, daily_portion, daily_portion]
  );
  return result;
};

const update = async (dishID, { name, description, note, image_url, category, price, daily_portion }) => {
  const [result] = await pool.execute(
    "UPDATE `Dish` SET `name` = ?, `description` = ?, `note` = ?, `image_url` = ?, `category` = ?, `price` = ?, `daily_portion` = ?, `current_portion` = ?, `is_available` = ? WHERE `dishID` = ?",
    [name, description || null, note || null, image_url || null, category, price, daily_portion, daily_portion, daily_portion > 0, dishID]
  );
  return result;
};

const decreasePortion = async (dishID, quantity) => {
  const [result] = await pool.execute(
    "UPDATE `Dish` SET `current_portion` = `current_portion` - ?, `is_available` = CASE WHEN (`current_portion` - ?) <= 0 THEN FALSE ELSE TRUE END WHERE `dishID` = ? AND `current_portion` >= ?",
    [quantity, quantity, dishID, quantity]
  );
  return result;
};

const deleteDish = async (dishID) => {
  const [result] = await pool.execute(
    "DELETE FROM `Dish` WHERE `dishID` = ?",
    [dishID]
  );
  return result;
};

module.exports = {
  findAll,
  findAllForChef,
  findById,
  create,
  update,
  decreasePortion,
  deleteDish,
};
