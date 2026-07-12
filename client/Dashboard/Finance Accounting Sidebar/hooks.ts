import { useState, useEffect, useMemo, useCallback } from 'react';
import { financeAPI } from '../../services/finance';
import type { FinanceData, ChartOfAccount, ARInvoice, BankTransaction, Budget, FixedAsset, TaxRecord } from './types';

export function useFinance() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await financeAPI.getOverview();
      const json = response.data?.data ?? response.data;
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

  const getChildAccounts = useCallback((parentId: string): ChartOfAccount[] => {
    return data?.chart_of_accounts.filter((a) => a.parent_id === parentId) || [];
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
    getChildAccounts,
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
