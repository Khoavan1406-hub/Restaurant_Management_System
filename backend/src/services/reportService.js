const reportModel = require("../models/reportModel");

const getPeriodRange = (period) => {
  const now = new Date();
  const end = new Date(now);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "week") {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);

    const nextWeek = new Date(start);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(0, 0, 0, 0);
    return { start, end: nextWeek };
  }

  if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const nextMonth = new Date(start);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setHours(0, 0, 0, 0);
    return { start, end: nextMonth };
  }

  const nextDay = new Date(start);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);
  return { start, end: nextDay };
};

const getEmployeePerformance = async (period = "today") => {
  const normalizedPeriod = ["today", "week", "month"].includes(period) ? period : "today";
  const { start, end } = getPeriodRange(normalizedPeriod);

  const [chefs, waiters] = await Promise.all([
    reportModel.findChefPerformance(start, end),
    reportModel.findWaiterPerformance(start, end),
  ]);

  return {
    period: normalizedPeriod,
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    chefs,
    waiters,
  };
};

module.exports = {
  getEmployeePerformance,
};