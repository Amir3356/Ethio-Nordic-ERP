import { useMemo } from 'react';
import type { useFinance } from './hooks';

type FinanceHook = ReturnType<typeof useFinance>;

interface Props {
  finance: FinanceHook;
}

export default function FinancialStatements({ finance }: Props) {
  const { data } = finance;

  const accountBalances = useMemo(() => {
    if (!data) return [];
    const balances: Record<string, { debit: number; credit: number }> = {};

    data.journal_lines.forEach((line) => {
      if (!balances[line.account_id]) {
        balances[line.account_id] = { debit: 0, credit: 0 };
      }
      balances[line.account_id].debit += line.debit;
      balances[line.account_id].credit += line.credit;
    });

    return Object.entries(balances).map(([accountId, balance]) => {
      const account = data.chart_of_accounts.find((a) => a.id === accountId);
      return {
        account,
        debit: balance.debit,
        credit: balance.credit,
        balance: balance.debit - balance.credit,
      };
    }).filter((b) => b.account);
  }, [data]);

  const balanceSheet = useMemo(() => {
    const assets = accountBalances
      .filter((b) => b.account?.type === 'Asset')
      .reduce((sum, b) => sum + b.balance, 0);
    const liabilities = accountBalances
      .filter((b) => b.account?.type === 'Liability')
      .reduce((sum, b) => sum + b.balance, 0);
    const equity = accountBalances
      .filter((b) => b.account?.type === 'Equity')
      .reduce((sum, b) => sum + b.balance, 0);
    return { assets, liabilities, equity };
  }, [accountBalances]);

  const incomeStatement = useMemo(() => {
    const revenue = accountBalances
      .filter((b) => b.account?.type === 'Revenue')
      .reduce((sum, b) => sum + b.balance, 0);
    const expenses = accountBalances
      .filter((b) => b.account?.type === 'Expense')
      .reduce((sum, b) => sum + Math.abs(b.balance), 0);
    return { revenue, expenses, netIncome: revenue - expenses };
  }, [accountBalances]);

  if (!data) return null;

  return (
    <section className="content-section" id="financial-statements">
      <div className="content-section-header">
        <h2>Financial Statements</h2>
      </div>

      <p className="content-description">
        Automated Income Statement, Balance Sheet, and Cash Flow generation for statutory filing and management review.
      </p>

      <div className="finance-stats-grid">
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-blue">
            <span style={{ fontSize: 18 }}>BS</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{balanceSheet.assets.toLocaleString()} ETB</span>
            <span className="finance-stat-label">Total Assets</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-red">
            <span style={{ fontSize: 18 }}>BS</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{balanceSheet.liabilities.toLocaleString()} ETB</span>
            <span className="finance-stat-label">Total Liabilities</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-purple">
            <span style={{ fontSize: 18 }}>BS</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{balanceSheet.equity.toLocaleString()} ETB</span>
            <span className="finance-stat-label">Total Equity</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className={`finance-stat-icon ${incomeStatement.netIncome >= 0 ? 'finance-stat-icon-green' : 'finance-stat-icon-red'}`}>
            <span style={{ fontSize: 18 }}>IS</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{incomeStatement.netIncome.toLocaleString()} ETB</span>
            <span className="finance-stat-label">Net Income</span>
          </div>
        </div>
      </div>

      <h3 className="finance-subsection-title">Balance Sheet Summary</h3>
      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount (ETB)</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="finance-table-name">Total Assets</td>
              <td className="finance-text-bold">{balanceSheet.assets.toLocaleString()}</td>
              <td>100%</td>
            </tr>
            <tr>
              <td className="finance-table-name">Total Liabilities</td>
              <td className="finance-text-bold">{balanceSheet.liabilities.toLocaleString()}</td>
              <td>{balanceSheet.assets > 0 ? ((balanceSheet.liabilities / balanceSheet.assets) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td className="finance-table-name">Total Equity</td>
              <td className="finance-text-bold">{balanceSheet.equity.toLocaleString()}</td>
              <td>{balanceSheet.assets > 0 ? ((balanceSheet.equity / balanceSheet.assets) * 100).toFixed(1) : 0}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="finance-subsection-title">Income Statement Summary</h3>
      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Line Item</th>
              <th>Amount (ETB)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="finance-table-name">Total Revenue</td>
              <td className="finance-text-green">{incomeStatement.revenue.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="finance-table-name">Total Expenses</td>
              <td className="finance-text-red">{incomeStatement.expenses.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="finance-table-name" style={{ fontWeight: 800 }}>Net Income</td>
              <td className={incomeStatement.netIncome >= 0 ? 'finance-text-green' : 'finance-text-red'} style={{ fontWeight: 800 }}>
                {incomeStatement.netIncome.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="content-description" style={{ marginTop: 16 }}>
        Export to Excel and PDF available for statutory filing and management review.
      </p>
    </section>
  );
}
