import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  verifyTwoFactor: (email, code) => api.post('/auth/verify-2fa', { email, code }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  enable2FA: () => api.post('/auth/enable-2fa'),
  disable2FA: (code) => api.post('/auth/disable-2fa', { code }),
  activate: (data) => api.post('/auth/activate', data),
  verifyActivationToken: (token) => api.post('/auth/verify-activation-token', { token }),
  setPassword: (token, password, password_confirmation) =>
    api.post('/auth/set-password', { token, password, password_confirmation }),
};

export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.post(`/users/${id}/deactivate`),
  activate: (id) => api.post(`/users/${id}/activate`),
  getPermissions: (id) => api.get(`/users/${id}/permissions`),
  bulkAction: (data) => api.post('/users/bulk-action', data),
};

export const roleService = {
  getAll: () => api.get('/roles'),
  getById: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
};

export const permissionService = {
  getAll: () => api.get('/permissions'),
  getById: (id) => api.get(`/permissions/${id}`),
  getByModule: (module) => api.get(`/permissions/module/${module}`),
};

export const loginActivityService = {
  getAll: (params) => api.get('/login-activity', { params }),
  getUserActivity: (id, params) => api.get(`/login-activity/user/${id}`, { params }),
  getStats: (params) => api.get('/login-activity/stats', { params }),
  getOnlineUsers: () => api.get('/login-activity/online'),
};

export const auditLogService = {
  getAll: (params) => api.get('/audit-logs', { params }),
  getById: (id) => api.get(`/audit-logs/${id}`),
  getEntityHistory: (entityType, entityId) => api.get(`/audit-logs/entity/${entityType}/${entityId}`),
  getModuleHistory: (module) => api.get(`/audit-logs/module/${module}`),
  getUserHistory: (userId) => api.get(`/audit-logs/user/${userId}`),
};

export const sessionService = {
  getAll: (params) => api.get('/sessions', { params }),
  delete: (tokenId) => api.delete(`/sessions/${tokenId}`),
  deleteAllForUser: (userId) => api.delete(`/sessions/user/${userId}`),
  forceLogout: (userId) => api.post(`/sessions/force-logout/${userId}`),
  getStats: () => api.get('/sessions/stats'),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard'),
};

export default api;
