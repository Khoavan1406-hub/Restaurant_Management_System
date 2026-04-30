const menuService = require("../services/menuService");
const auditLogModel = require("../models/auditLogModel");

// GET /api/menu
const getAll = async (req, res, next) => {
  try {
    const dishes = await menuService.getMenu(req.user.role);
    res.json(dishes);
  } catch (error) {
    next(error);
  }
};

// POST /api/menu (multipart/form-data with image file)
const create = async (req, res, next) => {
  try {
    const { name, description, note, category, price, daily_portion } = req.body;
    if (!name || !category || !price || !daily_portion) {
      return res.status(400).json({ message: "Missing required fields: name, category, price, daily_portion" });
    }

    // If a file was uploaded, build the URL path
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await menuService.createDish(req.user.userID, { name, description, note, image_url, category, price, daily_portion });
    await auditLogModel.create(req.user.userID, "CREATE_DISH", `Added dish: ${name}`);

    res.status(201).json({ message: "Dish created successfully", dishID: result.insertId });
  } catch (error) {
    next(error);
  }
};

// PUT /api/menu/:id (multipart/form-data with optional image file)
const update = async (req, res, next) => {
  try {
    const dishID = parseInt(req.params.id);
    const { name, description, note, category, price, daily_portion } = req.body;

    // If new file uploaded, use it; otherwise keep existing (pass null to not overwrite)
    const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url || null;

    await menuService.updateDish(dishID, { name, description, note, image_url, category, price, daily_portion });
    await auditLogModel.create(req.user.userID, "UPDATE_DISH", `Updated dish ID=${dishID}`);

    res.json({ message: "Dish updated successfully" });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/menu/:id
const remove = async (req, res, next) => {
  try {
    const dishID = parseInt(req.params.id);
    await menuService.deleteDish(dishID);
    await auditLogModel.create(req.user.userID, "DELETE_DISH", `Deleted dish ID=${dishID}`);

    res.json({ message: "Dish deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, update, remove };
