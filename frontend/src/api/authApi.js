import api from "./axiosConfig";

export const loginApi = (username, password) =>
  api.post("/auth/login", { username, password });

export const logoutApi = () => api.post("/auth/logout");
