import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';

export const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface UserData {
  full_name: string;
  email: string;
  department: string;
  role_ids: number[];
}

export interface PaginationParams {
  per_page?: number;
  sort?: string;
  page?: number;
}

export const authAPI = {
  login: (email: string, password: string, twoFactorCode: string | null = null) =>
    api.post('/auth/login', { email, password, two_factor_code: twoFactorCode }),

  logout: () =>
    api.post('/auth/logout'),

  getCurrentUser: () =>
    api.get('/auth/me'),

  changePassword: (currentPassword: string, password: string) =>
    api.post('/auth/change-password', { current_password: currentPassword, password, password_confirmation: password }),

  setupTwoFactor: () =>
    api.post('/auth/setup-2fa'),

  verifyTwoFactor: (code: string) =>
    api.post('/auth/verify-2fa', { two_factor_code: code }),

  disableTwoFactor: (password: string, code: string) =>
    api.post('/auth/disable-2fa', { password, two_factor_code: code }),

  setupTwoFactorOnboarding: (token: string) =>
    api.post('/auth/setup-2fa-onboarding', { token }),

  verifyTwoFactorOnboarding: (token: string, code: string) =>
    api.post('/auth/verify-2fa-onboarding', { token, two_factor_code: code }),

  skipTwoFactorOnboarding: (token: string) =>
    api.post('/auth/skip-2fa-onboarding', { token }),

  getActiveSessions: () =>
    api.get('/auth/sessions'),

  revokeSession: (tokenId: string) =>
    api.delete(`/auth/sessions/${tokenId}`),

  revokeAllOtherSessions: () =>
    api.post('/auth/revoke-all-sessions'),
};

export const userAPI = {
  getAll: (params?: PaginationParams) =>
    api.get('/users', { params }),

  getById: (id: number) =>
    api.get(`/users/${id}`),

  create: (userData: UserData) =>
    api.post('/users', userData),

  update: (id: number, userData: UserData) =>
    api.put(`/users/${id}`, userData),

  delete: (id: number) =>
    api.delete(`/users/${id}`),

  activate: (id: number) =>
    api.post(`/users/${id}/activate`),

  deactivate: (id: number) =>
    api.post(`/users/${id}/deactivate`),

  resendActivation: (id: number) =>
    api.post(`/users/${id}/resend-activation`),

  resetPassword: (id: number) =>
    api.post(`/users/${id}/reset-password`),

  bulkAction: (userIds: number[], action: string) =>
    api.post('/users/bulk-action', { user_ids: userIds, action }),

  getUserPermissions: (id: number) =>
    api.get(`/users/${id}/permissions`),

  getAccessReview: (inactiveDays: number = 90) =>
    api.get('/users/access-review', { params: { inactive_days: inactiveDays } }),
};

export const roleAPI = {
  getAll: (params?: PaginationParams) =>
    api.get('/roles', { params }),

  getById: (id: number) =>
    api.get(`/roles/${id}`),
};

export const auditLogAPI = {
  getAll: (params?: PaginationParams) =>
    api.get('/audit-logs', { params }),

  getById: (id: number) =>
    api.get(`/audit-logs/${id}`),
};

export const sessionAPI = {
  getAll: (params?: PaginationParams) =>
    api.get('/sessions', { params }),

  getActive: () =>
    api.get('/sessions/active'),

  getUserSessions: (userId: number) =>
    api.get(`/sessions/user/${userId}`),

  terminate: (tokenId: string) =>
    api.delete(`/sessions/${tokenId}`),

  terminateAllUserSessions: (userId: number) =>
    api.post(`/sessions/user/${userId}/terminate-all`),
};

export default api;
