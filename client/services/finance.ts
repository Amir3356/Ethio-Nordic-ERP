import { api } from './client';

export const financeAPI = {
  getOverview: () =>
    api.get('/finance'),

  createAccount: (data: Record<string, unknown>) =>
    api.post('/finance/accounts', data),

  updateAccount: (id: string, data: Record<string, unknown>) =>
    api.put(`/finance/accounts/${id}`, data),

  createJournalEntry: (data: Record<string, unknown>) =>
    api.post('/finance/journal-entries', data),

  approveJournalEntry: (id: string) =>
    api.post(`/finance/journal-entries/${id}/approve`),

  createApInvoice: (data: Record<string, unknown>) =>
    api.post('/finance/ap-invoices', data),

  approveApInvoice: (id: string) =>
    api.post(`/finance/ap-invoices/${id}/approve`),

  payApInvoice: (id: string, data: Record<string, unknown>) =>
    api.post(`/finance/ap-invoices/${id}/pay`, data),

  createArInvoice: (data: Record<string, unknown>) =>
    api.post('/finance/ar-invoices', data),

  recordArPayment: (id: string, data: Record<string, unknown>) =>
    api.post(`/finance/ar-invoices/${id}/record-payment`, data),

  createBankTransaction: (data: Record<string, unknown>) =>
    api.post('/finance/bank-transactions', data),

  reconcileBankTransaction: (id: string) =>
    api.post(`/finance/bank-transactions/${id}/reconcile`),

  createBudget: (data: Record<string, unknown>) =>
    api.post('/finance/budgets', data),

  createFixedAsset: (data: Record<string, unknown>) =>
    api.post('/finance/fixed-assets', data),

  closePeriod: (period: string) =>
    api.post('/finance/periods/close', { period }),

  reopenPeriod: (period: string, justification: string) =>
    api.post('/finance/periods/reopen', { period, justification }),

  getStatements: (asOf?: string) =>
    api.get('/finance/statements', { params: asOf ? { as_of: asOf } : undefined }),
};
