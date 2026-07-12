import { api } from './client';

export const financeAPI = {
  getOverview: () =>
    api.get('/finance'),
};
