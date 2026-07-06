import { api } from './client';
import type { PaginationParams } from './types';

export const roleAPI = {
  getAll: (params?: PaginationParams) =>
    api.get('/roles', { params }),

  getById: (id: number) =>
    api.get(`/roles/${id}`),
};
