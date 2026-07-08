import { useState, useEffect, useMemo, useCallback } from 'react';
import type { FinanceData, ChartOfAccount, JournalEntry, JournalLine, APInvoice, ARInvoice, BankTransaction, Budget, FixedAsset, TaxRecord } from './types';

export function useFinance() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/finance-accounting.json');
      if (!response.ok) throw new Error('Failed to load finance data');
      const json = await response.json();
      setData(json);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAccount = useCallback((id: string): ChartOfAccount | undefined => {
    return data?.chart_of_accounts.find((a) => a.id === id);
  }, [data]);

  const getAccountByCode = useCallback((code: string): ChartOfAccount | undefined => {
    return data?.chart_of_accounts.find((a) => a.code === code);
  }, [data]);

  const getChildAccounts = useCallback((parentId: string): ChartOfAccount[] => {
    return data?.chart_of_accounts.filter((a) => a.parent_id === parentId) || [];
  }, [data]);

  const getRootAccounts = useCallback((): ChartOfAccount[] => {
    return data?.chart_of_accounts.filter((a) => a.parent_id === null) || [];
  }, [data]);

  const getJournalLines = useCallback((entryId: string): JournalLine[] => {
    return data?.journal_lines.filter((l) => l.journal_entry_id === entryId) || [];
  }, [data]);

  const getAccountTransactions = useCallback((accountId: string): JournalLine[] => {
    return data?.journal_lines.filter((l) => l.account_id === accountId) || [];
  }, [data]);

  const getAPInvoicesByStatus = useCallback((status: string): APInvoice[] => {
    return data?.ap_invoices.filter((i) => i.status === status) || [];
  }, [data]);

  const getARInvoicesByStatus = useCallback((status: string): ARInvoice[] => {
    return data?.ar_invoices.filter((i) => i.status === status) || [];
  }, [data]);

  const getOverdueARInvoices = useCallback((): ARInvoice[] => {
    return data?.ar_invoices.filter((i) => i.status === 'overdue') || [];
  }, [data]);

  const getUnreconciledTransactions = useCallback((): BankTransaction[] => {
    return data?.bank_transactions.filter((t) => !t.reconciled) || [];
  }, [data]);

  const getBudgetByPeriod = useCallback((period: string): Budget[] => {
    return data?.budgets.filter((b) => b.period === period) || [];
  }, [data]);

  const getActiveFixedAssets = useCallback((): FixedAsset[] => {
    return data?.fixed_assets.filter((a) => a.status === 'active') || [];
  }, [data]);

  const getPendingTaxRecords = useCallback((): TaxRecord[] => {
    return data?.tax_records.filter((t) => t.status === 'pending' || t.status === 'accrued') || [];
  }, [data]);

  const getTotalAPBalance = useMemo(() => {
    if (!data) return 0;
    return data.ap_invoices
      .filter((i) => i.status !== 'paid')
      .reduce((sum, i) => sum + i.amount_etb, 0);
  }, [data]);

  const getTotalARBalance = useMemo(() => {
    if (!data) return 0;
    return data.ar_invoices
      .filter((i) => i.status !== 'paid' && i.status !== 'written_off')
      .reduce((sum, i) => sum + i.total_amount, 0);
  }, [data]);

  const getTotalFixedAssetValue = useMemo(() => {
    if (!data) return 0;
    return data.fixed_assets
      .filter((a) => a.status === 'active')
      .reduce((sum, a) => sum + a.net_book_value, 0);
  }, [data]);

  const getTotalMonthlyDepreciation = useMemo(() => {
    if (!data) return 0;
    return data.fixed_assets
      .filter((a) => a.status === 'active')
      .reduce((sum, a) => sum + a.monthly_depreciation, 0);
  }, [data]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    getAccount,
    getAccountByCode,
    getChildAccounts,
    getRootAccounts,
    getJournalLines,
    getAccountTransactions,
    getAPInvoicesByStatus,
    getARInvoicesByStatus,
    getOverdueARInvoices,
    getUnreconciledTransactions,
    getBudgetByPeriod,
    getActiveFixedAssets,
    getPendingTaxRecords,
    getTotalAPBalance,
    getTotalARBalance,
    getTotalFixedAssetValue,
    getTotalMonthlyDepreciation,
  };
}
