import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('careconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid or expired
      if (localStorage.getItem('careconnect_token')) {
        localStorage.removeItem('careconnect_token');
        localStorage.removeItem('careconnect_user');
        window.dispatchEvent(new Event('auth_logout'));
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Emergency endpoints
export const emergencyService = {
  create: (data) => api.post('/emergencies', data),
  getAll: (params) => api.get('/emergencies', { params }),
  getById: (id) => api.get(`/emergencies/${id}`),
  updateStatus: (id, data) => api.put(`/emergencies/${id}/status`, data),
  cancel: (id, reason) => api.delete(`/emergencies/${id}`, { data: { reason } }),
};

// Volunteer endpoints
export const volunteerService = {
  getNearby: (params) => api.get('/volunteers/nearby', { params }),
  updateAvailability: (data) => api.put('/volunteers/availability', data),
  acceptEmergency: (id) => api.post(`/volunteers/accept/${id}`),
  rejectEmergency: (id) => api.post(`/volunteers/reject/${id}`),
  getActiveEmergency: () => api.get('/volunteers/active-emergency'),
};

// Admin endpoints
export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  getEmergencies: (params) => api.get('/admin/emergencies', { params }),
};

// Notification endpoints
export const notificationService = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
