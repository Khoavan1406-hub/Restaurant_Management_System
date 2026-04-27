import api from "./axiosConfig";

export const getActiveSessions = () => api.get("/orders/sessions/active");
export const openSession = (table_number) => api.post("/orders/sessions", { table_number });
export const closeSession = (sessionID) => api.patch(`/orders/sessions/${sessionID}/close`);
export const createOrder = (sessionID, items) => api.post("/orders", { sessionID, items });
export const getOrdersBySession = (sessionID) => api.get(`/orders/session/${sessionID}`);
export const getPendingOrders = () => api.get("/orders/pending");
export const getWaiterReadyOrders = () => api.get("/orders/waiter/ready");
export const updateWaiterOrderStatus = (orderID, status) =>
	api.patch(`/orders/${orderID}/waiter-status`, { status });
