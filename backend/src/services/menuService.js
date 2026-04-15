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
  return await dishModel.deleteDish(dishID);
};

module.exports = { getMenu, createDish, updateDish, deleteDish };
