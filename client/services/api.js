import axios from 'axios';

// Create API instance with base configuration
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (email, password, twoFactorCode = null) =>
    api.post('/auth/login', { email, password, two_factor_code: twoFactorCode }),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  changePassword: (currentPassword, password) =>
    api.post('/auth/change-password', { current_password: currentPassword, password, password_confirmation: password }),
  
  setupTwoFactor: () =>
    api.post('/auth/setup-2fa'),
  
  verifyTwoFactor: (code) =>
    api.post('/auth/verify-2fa', { two_factor_code: code }),
  
  disableTwoFactor: (password, code) =>
    api.post('/auth/disable-2fa', { password, two_factor_code: code }),
  
  setupTwoFactorOnboarding: (token) =>
    api.post('/auth/setup-2fa-onboarding', { token }),
  
  verifyTwoFactorOnboarding: (token, code) =>
    api.post('/auth/verify-2fa-onboarding', { token, two_factor_code: code }),
  
  skipTwoFactorOnboarding: (token) =>
    api.post('/auth/skip-2fa-onboarding', { token }),
  
  getActiveSessions: () =>
    api.get('/auth/sessions'),
  
  revokeSession: (tokenId) =>
    api.delete(`/auth/sessions/${tokenId}`),
  
  revokeAllOtherSessions: () =>
    api.post('/auth/revoke-all-sessions'),
};

// User API calls
export const userAPI = {
  getAll: (params) =>
    api.get('/users', { params }),
  
  getById: (id) =>
    api.get(`/users/${id}`),
  
  create: (userData) =>
    api.post('/users', userData),
  
  update: (id, userData) =>
    api.put(`/users/${id}`, userData),
  
  delete: (id) =>
    api.delete(`/users/${id}`),
  
  activate: (id) =>
    api.post(`/users/${id}/activate`),
  
  deactivate: (id) =>
    api.post(`/users/${id}/deactivate`),
  
  resendActivation: (id) =>
    api.post(`/users/${id}/resend-activation`),
  
  resetPassword: (id) =>
    api.post(`/users/${id}/reset-password`),
  
  bulkAction: (userIds, action) =>
    api.post('/users/bulk-action', { user_ids: userIds, action }),
  
  getUserPermissions: (id) =>
    api.get(`/users/${id}/permissions`),
  
  getAccessReview: (inactiveDays = 90) =>
    api.get('/users/access-review', { params: { inactive_days: inactiveDays } }),
};

// Permission API calls
export const permissionAPI = {
  getAll: (params) =>
    api.get('/permissions', { params }),
  
  getModules: () =>
    api.get('/permissions/modules/list'),
  
  getActions: () =>
    api.get('/permissions/actions/list'),
  
  getGroupedByModule: () =>
    api.get('/permissions/grouped/by-module'),
  
  getRoleMatrix: () =>
    api.get('/permissions/matrix/roles'),
};

// Role API calls
export const roleAPI = {
  getAll: (params) =>
    api.get('/roles', { params }),
  
  getById: (id) =>
    api.get(`/roles/${id}`),
};

// Login Activity API calls
export const loginActivityAPI = {
  getAll: (params) =>
    api.get('/login-activity', { params }),
  
  getUserActivity: (userId, params) =>
    api.get(`/login-activity/user/${userId}`, { params }),
  
  getFailedLogins: (params) =>
    api.get('/security/failed-logins', { params }),
};

// Audit Log API calls
export const auditLogAPI = {
  getAll: (params) =>
    api.get('/audit-logs', { params }),
  
  getById: (id) =>
    api.get(`/audit-logs/${id}`),
};

// Session API calls
export const sessionAPI = {
  getAll: (params) =>
    api.get('/sessions', { params }),
  
  getActive: () =>
    api.get('/sessions/active'),
  
  getUserSessions: (userId) =>
    api.get(`/sessions/user/${userId}`),
  
  terminate: (tokenId) =>
    api.delete(`/sessions/${tokenId}`),
  
  terminateAllUserSessions: (userId) =>
    api.post(`/sessions/user/${userId}/terminate-all`),
};

export default api;
