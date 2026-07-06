import { api } from './client';
import type { PaginationParams } from './types';

export const auditLogAPI = {
  getAll: (params?: PaginationParams) =>
    api.get('/audit-logs', { params }),

  getById: (id: number) =>
    api.get(`/audit-logs/${id}`),
};
