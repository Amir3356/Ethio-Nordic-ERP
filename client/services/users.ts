import { api } from './client';
import type { UserData, PaginationParams } from './types';

export const userAPI = {
  getAll: (params?: PaginationParams) =>
    api.get('/users', { params }),

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

  getAccessReview: (inactiveDays: number = 90) =>
    api.get('/users/access-review', { params: { inactive_days: inactiveDays } }),

  getAllPermissionsGrouped: () =>
    api.get('/permissions/grouped/by-module'),
};
