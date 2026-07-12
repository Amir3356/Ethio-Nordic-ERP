import { api } from './client';

export const inventoryAPI = {
  getOverview: () =>
    api.get('/inventory'),

  createBatch: (data: Record<string, unknown>) =>
    api.post('/inventory/batches', data),

  updateBatch: (id: string | number, data: Record<string, unknown>) =>
    api.put(`/inventory/batches/${id}`, data),

  deleteBatch: (id: string | number) =>
    api.delete(`/inventory/batches/${id}`),

  issueStock: (data: Record<string, unknown>) =>
    api.post('/inventory/issue', data),

  createAdjustment: (data: Record<string, unknown>) =>
    api.post('/inventory/adjustments', data),

  approveAdjustment: (id: string) =>
    api.post(`/inventory/adjustments/${id}/approve`),

  createDamagedGood: (data: Record<string, unknown>) =>
    api.post('/inventory/damaged-goods', data),

  approveDamagedGood: (id: string) =>
    api.post(`/inventory/damaged-goods/${id}/approve`),

  rejectDamagedGood: (id: string) =>
    api.post(`/inventory/damaged-goods/${id}/reject`),
};
