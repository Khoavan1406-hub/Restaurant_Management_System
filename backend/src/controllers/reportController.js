const reportService = require("../services/reportService");

const getEmployeePerformance = async (req, res, next) => {
  try {
    const { period } = req.query;
    const data = await reportService.getEmployeePerformance(period);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployeePerformance,
};