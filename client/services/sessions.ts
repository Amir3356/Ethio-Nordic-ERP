import { api } from './client';
import type { PaginationParams } from './types';

export const sessionAPI = {
  getAll: (params?: PaginationParams) =>
    api.get('/sessions', { params }),

  getActive: () =>
    api.get('/sessions/active'),

  getStats: () =>
    api.get('/sessions/stats'),

  getUserSessions: (userId: number) =>
    api.get(`/sessions/user/${userId}`),

  terminate: (tokenId: string) =>
    api.delete(`/sessions/${tokenId}`),

  terminateAllUserSessions: (userId: number) =>
    api.post(`/sessions/user/${userId}/terminate-all`),

  getIdleTimeout: () =>
    api.get('/sessions/idle-timeout'),

  updateIdleTimeout: (idleTimeoutMinutes: number) =>
    api.put('/sessions/idle-timeout', { idle_timeout_minutes: idleTimeoutMinutes }),
};
