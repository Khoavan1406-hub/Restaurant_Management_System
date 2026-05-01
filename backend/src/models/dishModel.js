const { pool } = require("../config/db");

const findAll = async () => {
  const [rows] = await pool.execute(
    "SELECT * FROM `Dish` ORDER BY `category`, `name`"
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
  const isAvailable = daily_portion > 0;
  const [result] = await pool.execute(
    "INSERT INTO `Dish` (`chefID`, `name`, `description`, `note`, `image_url`, `category`, `price`, `daily_portion`, `current_portion`, `is_available`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [chefID, name, description || null, note || null, image_url || null, category, price, daily_portion, daily_portion, isAvailable]
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

const isUsedInOrders = async (dishID) => {
  const [rows] = await pool.execute(
    "SELECT 1 FROM `OrderItem` WHERE `dishID` = ? LIMIT 1",
    [dishID]
  );
  return rows.length > 0;
};

const bulkCreate = async (chefID, items) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let createdCount = 0;
    let updatedCount = 0;
    const processedIds = [];

    for (const item of items) {
      const [rows] = await conn.execute(
        "SELECT `dishID`, `name`, `description`, `note`, `image_url`, `category`, `price`, `daily_portion`, `current_portion`, `is_available` FROM `Dish` WHERE `name` = ? LIMIT 1",
        [item.name]
      );

      if (rows.length > 0) {
        const existing = rows[0];
        const name = item.name != null ? item.name : existing.name;
        const description = item.description != null ? item.description : existing.description;
        const note = item.note != null ? item.note : existing.note;
        const imageUrl = item.image_url != null ? item.image_url : existing.image_url;
        const category = item.category != null ? item.category : existing.category;
        const price = item.price != null ? item.price : existing.price;

        let dailyPortion = existing.daily_portion;
        let currentPortion = existing.current_portion;
        let isAvailable = existing.is_available;
        if (item.daily_portion != null) {
          dailyPortion = item.daily_portion;
          currentPortion = item.daily_portion;
          isAvailable = item.daily_portion > 0;
        }

        await conn.execute(
          "UPDATE `Dish` SET `name` = ?, `description` = ?, `note` = ?, `image_url` = ?, `category` = ?, `price` = ?, `daily_portion` = ?, `current_portion` = ?, `is_available` = ? WHERE `dishID` = ?",
          [
            name,
            description ?? null,
            note ?? null,
            imageUrl ?? null,
            category,
            price,
            dailyPortion,
            currentPortion,
            isAvailable,
            existing.dishID,
          ]
        );
        updatedCount += 1;
        processedIds.push(existing.dishID);
      } else {
        const [result] = await conn.execute(
          "INSERT INTO `Dish` (`chefID`, `name`, `description`, `note`, `image_url`, `category`, `price`, `daily_portion`, `current_portion`, `is_available`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)",
          [
            chefID,
            item.name,
            item.description ?? null,
            item.note ?? null,
            item.image_url ?? null,
            item.category,
            item.price,
            item.daily_portion,
            item.daily_portion,
          ]
        );
        createdCount += 1;
        processedIds.push(result.insertId);
      }
    }

    let zeroedCount = 0;
    if (processedIds.length > 0) {
      const placeholders = processedIds.map(() => "?").join(",");
      const [zeroResult] = await conn.execute(
        `UPDATE \`Dish\` SET \`daily_portion\` = 0, \`current_portion\` = 0, \`is_available\` = FALSE WHERE \`dishID\` NOT IN (${placeholders})`,
        processedIds
      );
      zeroedCount = zeroResult.affectedRows || 0;
    }

    await conn.commit();
    return { createdCount, updatedCount, zeroedCount };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = {
  findAll,
  findAllForChef,
  findById,
  create,
  update,
  decreasePortion,
  deleteDish,
  isUsedInOrders,
  bulkCreate,
};
