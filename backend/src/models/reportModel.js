const { pool } = require("../config/db");

const findChefPerformance = async (startDate, endDate) => {
  const [rows] = await pool.execute(
    `SELECT u.userID,
            u.username,
            u.role,
            COALESCE(stats.completedOrders, 0) AS completedOrders
     FROM \`User\` u
     LEFT JOIN (
       SELECT chefID, COUNT(*) AS completedOrders
       FROM \`Order\`
       WHERE status = 'Completed'
         AND chefID IS NOT NULL
         AND timestamp >= ?
         AND timestamp < ?
       GROUP BY chefID
     ) stats ON stats.chefID = u.userID
     WHERE u.role = 'Chef'
     ORDER BY completedOrders DESC, u.username ASC`,
    [startDate, endDate]
  );
  return rows;
};

const findWaiterPerformance = async (startDate, endDate) => {
  const [rows] = await pool.execute(
    `SELECT u.userID,
            u.username,
            u.role,
            COALESCE(stats.totalBill, 0) AS totalBill,
            COALESCE(stats.completedSessions, 0) AS completedSessions
     FROM \`User\` u
     LEFT JOIN (
       SELECT waiterID,
              COUNT(*) AS completedSessions,
              COALESCE(SUM(total_bill), 0) AS totalBill
       FROM \`TableSession\`
       WHERE status = 'Completed'
         AND end_time IS NOT NULL
         AND end_time >= ?
         AND end_time < ?
       GROUP BY waiterID
     ) stats ON stats.waiterID = u.userID
     WHERE u.role = 'Waiter'
     ORDER BY totalBill DESC, u.username ASC`,
    [startDate, endDate]
  );
  return rows;
};

module.exports = {
  findChefPerformance,
  findWaiterPerformance,
};