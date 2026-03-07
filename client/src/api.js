import axios from "axios";
import { useAuthStore } from "./store";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ── API METHODS ──
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/password", data),
  toggleWishlist: (productId) => api.post(`/auth/wishlist/${productId}`),
};

export const productsAPI = {
  getAll: (params) => api.get("/products", { params }),
  getFeatured: () => api.get("/products/featured"),
  getCategories: () => api.get("/products/categories"),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
};

export const ordersAPI = {
  create: (data) => api.post("/orders", data),
  getMyOrders: (params) => api.get("/orders/my", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  pay: (id, data) => api.put(`/orders/${id}/pay`, data),
  cancel: (id, data) => api.put(`/orders/${id}/cancel`, data),
  // Admin
  getAll: (params) => api.get("/orders/admin/all", { params }),
  getAll: (params) => api.get("/orders/admin/all", { params }),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
};

export const paymentsAPI = {
  createIntent: (data) => api.post("/payments/create-payment-intent", data),
  createSession: (data) => api.post("/payments/create-checkout-session", data),
  verify: (sessionId) => api.get(`/payments/verify/${sessionId}`),
  refund: (data) => api.post("/payments/refund", data),
};

export const adminAPI = {
  getDashboard: () => api.get("/admin/dashboard"),
  getUsers: (params) => api.get("/admin/users", { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export const uploadAPI = {
  upload: (image) => api.post("/upload", { image }),
  delete: (publicId) => api.delete(`/upload/${encodeURIComponent(publicId)}`),
};

export default api;
