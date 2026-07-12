import { api } from './client';
import type { PaginationParams } from './types';

export const sessionAPI = {
  getAll: (params?: PaginationParams) =>
    api.get('/sessions', { params }),

  terminate: (tokenId: string) =>
    api.delete(`/sessions/${tokenId}`),
};
