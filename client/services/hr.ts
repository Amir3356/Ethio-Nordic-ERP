import { api } from './client';

export const hrAPI = {
  getOverview: () => api.get('/hr'),
};
