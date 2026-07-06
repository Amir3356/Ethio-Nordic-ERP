import { api } from './client';
import type { UserData, PaginationParams } from './types';

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
