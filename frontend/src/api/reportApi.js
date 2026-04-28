import api from "./axiosConfig";

export const getEmployeePerformance = (period = "today") =>
  api.get(`/reports/employees?period=${period}`);