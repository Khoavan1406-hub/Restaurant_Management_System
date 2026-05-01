const dishModel = require("../models/dishModel");

const getMenu = async (role) => {
  if (role === "Chef" || role === "Admin") {
    return await dishModel.findAllForChef();
  }
  return await dishModel.findAll();
};

const createDish = async (chefID, dishData) => {
  return await dishModel.create({ chefID, ...dishData });
};

const createDishesBulk = async (chefID, items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw { status: 400, message: "items array is required" };
  }

  const normalized = items.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw { status: 400, message: `Item #${index + 1} is invalid` };
    }

    const nameRaw = item.name;
    const categoryRaw = item.category;
    const priceRaw = item.price;
    const dailyPortionRaw = item.daily_portion;

    if (nameRaw == null || categoryRaw == null || priceRaw == null || dailyPortionRaw == null) {
      throw { status: 400, message: `Item #${index + 1} missing required fields` };
    }

    const name = String(nameRaw).trim();
    const category = String(categoryRaw).trim();
    const price = Number(priceRaw);
    const daily_portion = Number(dailyPortionRaw);

    if (!name || !category || !Number.isFinite(price) || !Number.isFinite(daily_portion)) {
      throw { status: 400, message: `Item #${index + 1} missing required fields` };
    }
    if (price < 0 || daily_portion < 0) {
      throw { status: 400, message: `Item #${index + 1} has invalid values` };
    }

    const description = "description" in item ? item.description : null;
    const note = "note" in item ? item.note : null;
    const image_url = "image_url" in item ? item.image_url : null;

    return {
      name,
      description,
      note,
      image_url,
      category,
      price,
      daily_portion,
    };
  });

  return await dishModel.bulkCreate(chefID, normalized);
};

const updateDish = async (dishID, dishData) => {
  const dish = await dishModel.findById(dishID);
  if (!dish) {
    throw { status: 404, message: "Dish not found" };
  }
  return await dishModel.update(dishID, dishData);
};

const deleteDish = async (dishID) => {
  const dish = await dishModel.findById(dishID);
  if (!dish) {
    throw { status: 404, message: "Dish not found" };
  }
  const used = await dishModel.isUsedInOrders(dishID);
  if (used) {
    throw { status: 400, message: "Cannot delete dish: it is ordered" };
  }
  return await dishModel.deleteDish(dishID);
};

module.exports = { getMenu, createDish, createDishesBulk, updateDish, deleteDish };
