import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to inject JWT token in Authorization headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const imageApi = {
  getImages: () => api.get('/images'),
  getImageById: (id) => api.get(`/images/${id}`),
  createImage: (formData) => api.post('/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateImage: (id, data) => api.put(`/images/${id}`, data),
  deleteImage: (id) => api.delete(`/images/${id}`),
};

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
};

export default api;
