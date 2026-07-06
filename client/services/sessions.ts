import { api } from './client';
import type { PaginationParams } from './types';

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
