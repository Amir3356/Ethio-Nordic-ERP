import { api } from './client';
import type { PaginationParams } from './types';

export const inventoryAPI = {
  getOverview: () =>
    api.get('/inventory'),

  getProducts: (params?: PaginationParams & { search?: string; category_id?: string; status?: string }) =>
    api.get('/inventory/products', { params }),

  createProduct: (data: Record<string, unknown>) =>
    api.post('/inventory/products', data),

  updateProduct: (id: string, data: Record<string, unknown>) =>
    api.put(`/inventory/products/${id}`, data),

  getWarehouses: () =>
    api.get('/inventory/warehouses'),

  createWarehouse: (data: Record<string, unknown>) =>
    api.post('/inventory/warehouses', data),

  getBatches: (params?: PaginationParams & { search?: string; product_id?: string; warehouse_id?: string; status?: string }) =>
    api.get('/inventory/batches', { params }),

  createBatch: (data: Record<string, unknown>) =>
    api.post('/inventory/batches', data),

  getMovements: (params?: PaginationParams & { search?: string; type?: string; product_id?: string; warehouse_id?: string }) =>
    api.get('/inventory/movements', { params }),

  getAdjustments: (params?: PaginationParams & { status?: string }) =>
    api.get('/inventory/adjustments', { params }),

  createAdjustment: (data: Record<string, unknown>) =>
    api.post('/inventory/adjustments', data),

  approveAdjustment: (id: string) =>
    api.post(`/inventory/adjustments/${id}/approve`),

  getReorderAlerts: () =>
    api.get('/inventory/reorder-alerts'),

  getDamagedGoods: (params?: PaginationParams & { status?: string }) =>
    api.get('/inventory/damaged-goods', { params }),

  createDamagedGood: (data: Record<string, unknown>) =>
    api.post('/inventory/damaged-goods', data),

  getExpiryMonitor: () =>
    api.get('/inventory/expiry-monitor'),

  getValuation: () =>
    api.get('/inventory/valuation'),

  // Warehouses - update
  updateWarehouse: (id: string, data: Record<string, unknown>) =>
    api.put(`/inventory/warehouses/${id}`, data),

  // Cycle Counts
  getCycleCounts: (params?: PaginationParams & { warehouse_id?: string; status?: string }) =>
    api.get('/inventory/cycle-counts', { params }),

  createCycleCount: (data: Record<string, unknown>) =>
    api.post('/inventory/cycle-counts', data),

  approveCycleCount: (id: string) =>
    api.post(`/inventory/cycle-counts/${id}/approve`),

  // Stock Transfers
  getTransfers: (params?: PaginationParams & { status?: string }) =>
    api.get('/inventory/transfers', { params }),

  createTransfer: (data: Record<string, unknown>) =>
    api.post('/inventory/transfers', data),

  approveTransfer: (id: string) =>
    api.post(`/inventory/transfers/${id}/approve`),

  completeTransfer: (id: string) =>
    api.post(`/inventory/transfers/${id}/complete`),

  // Damaged Goods - approve/reject
  approveDamagedGood: (id: string) =>
    api.post(`/inventory/damaged-goods/${id}/approve`),

  rejectDamagedGood: (id: string) =>
    api.post(`/inventory/damaged-goods/${id}/reject`),

  // FEFO Override
  createFefoOverride: (data: Record<string, unknown>) =>
    api.post('/inventory/fefo-overrides', data),

  // Reports
  getStockReport: (params?: { warehouse_id?: string; product_id?: string }) =>
    api.get('/inventory/reports/stock', { params }),

  exportStockReport: (params?: { warehouse_id?: string; format?: string }) =>
    api.get('/inventory/reports/stock/export', { params, responseType: 'blob' }),
};
