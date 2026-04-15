import api from "./axiosConfig";

export const getMenu = () => api.get("/menu");

export const createDish = (formData) =>
  api.post("/menu", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateDish = (dishID, formData) =>
  api.put(`/menu/${dishID}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteDish = (dishID) => api.delete(`/menu/${dishID}`);
