import api from "./axiosConfig";

export const getAllUsers = () => api.get("/users");
export const createUser = (userData) => api.post("/users", userData);
export const deleteUser = (userID) => api.delete(`/users/${userID}`);
