import { useMemo } from 'react';
import type { useFinance } from './hooks';

type FinanceHook = ReturnType<typeof useFinance>;

interface Props {
  finance: FinanceHook;
}

export default function ExpenseTracking({ finance }: Props) {
  const { data } = finance;

  const expenseAccounts = useMemo(() => {
    if (!data) return [];
    return data.chart_of_accounts.filter(
      (a) => a.type === 'Expense' && a.parent_id && a.cost_center
    );
  }, [data]);

  const totalExpenses = useMemo(() => {
    if (!data) return 0;
    const expenseAccountIds = expenseAccounts.map((a) => a.id);
    return data.journal_lines
      .filter((l) => expenseAccountIds.includes(l.account_id))
      .reduce((sum, l) => sum + l.debit, 0);
  }, [data, expenseAccounts]);

  const expensesByCostCenter = useMemo(() => {
    if (!data) return [];
    const expenseAccountIds = expenseAccounts.map((a) => a.id);
    const byCenter: Record<string, number> = {};

    data.journal_lines
      .filter((l) => expenseAccountIds.includes(l.account_id))
      .forEach((line) => {
        const account = expenseAccounts.find((a) => a.id === line.account_id);
        if (account?.cost_center) {
          byCenter[account.cost_center] = (byCenter[account.cost_center] || 0) + line.debit;
        }
      });

    return Object.entries(byCenter)
      .map(([center, amount]) => ({ center, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [data, expenseAccounts]);

  if (!data) return null;

  return (
    <section className="content-section" id="expense-tracking">
      <div className="content-section-header">
        <h2>Expense Tracking</h2>
      </div>

      <p className="content-description">
        Departmental and project-level expense capture with cost center allocation.
      </p>

      <div className="finance-stats-grid">
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-amber">
            <span style={{ fontSize: 18 }}>$</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{totalExpenses.toLocaleString()} ETB</span>
            <span className="finance-stat-label">Total Expenses</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-blue">
            <span style={{ fontSize: 18 }}>{expensesByCostCenter.length}</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{expensesByCostCenter.length}</span>
            <span className="finance-stat-label">Cost Centers</span>
          </div>
        </div>
      </div>

      <h3 className="finance-subsection-title">Expenses by Cost Center</h3>
      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Cost Center</th>
              <th>Total Expenses (ETB)</th>
              <th>% of Total</th>
              <th>Bar</th>
            </tr>
          </thead>
          <tbody>
            {expensesByCostCenter.map(({ center, amount }) => {
              const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
              return (
                <tr key={center}>
                  <td className="finance-table-name">{center}</td>
                  <td className="finance-text-bold">{amount.toLocaleString()}</td>
                  <td>{pct.toFixed(1)}%</td>
                  <td style={{ minWidth: 150 }}>
                    <div className="finance-budget-progress">
                      <div
                        className={`finance-budget-bar ${pct > 40 ? 'finance-budget-bar-over' : pct > 25 ? 'finance-budget-bar-warn' : 'finance-budget-bar-ok'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="finance-subsection-title">Expense Accounts</h3>
      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Account Code</th>
              <th>Account Name</th>
              <th>Cost Center</th>
              <th>Currency</th>
            </tr>
          </thead>
          <tbody>
            {expenseAccounts.map((account) => (
              <tr key={account.id}>
                <td className="finance-table-name">{account.code}</td>
                <td>{account.name}</td>
                <td>
                  <span className="finance-badge finance-badge-blue">{account.cost_center}</span>
                </td>
                <td>{account.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
