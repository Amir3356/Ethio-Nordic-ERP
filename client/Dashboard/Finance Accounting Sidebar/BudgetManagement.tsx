import { useMemo, useState } from 'react';
import type { useFinance } from './hooks';

type FinanceHook = ReturnType<typeof useFinance>;

interface Props {
  finance: FinanceHook;
}

export default function BudgetManagement({ finance }: Props) {
  const { data, getBudgetByPeriod } = finance;
  const [periodFilter, setPeriodFilter] = useState('2026-Q2');

  const periods = ['2026-Q1', '2026-Q2'];
  const budgets = useMemo(() => getBudgetByPeriod(periodFilter), [getBudgetByPeriod, periodFilter]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.budget_amount, 0);
  const totalActual = budgets.reduce((sum, b) => sum + b.actual_amount, 0);
  const totalVariance = totalBudget - totalActual;
  const overBudgetCount = budgets.filter((b) => b.status === 'over_budget').length;

  if (!data) return null;

  return (
    <section className="content-section" id="budget-management">
      <div className="content-section-header">
        <h2>Budget Management</h2>
      </div>

      <p className="content-description">
        Budget vs. actual tracking per cost center with real-time threshold alerts.
      </p>

      <div className="finance-stats-grid">
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-blue">
            <span style={{ fontSize: 18 }}>$</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{totalBudget.toLocaleString()} ETB</span>
            <span className="finance-stat-label">Total Budget</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-green">
            <span style={{ fontSize: 18 }}>$</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{totalActual.toLocaleString()} ETB</span>
            <span className="finance-stat-label">Total Actual</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className={`finance-stat-icon ${totalVariance >= 0 ? 'finance-stat-icon-green' : 'finance-stat-icon-red'}`}>
            <span style={{ fontSize: 18 }}>{totalVariance >= 0 ? '+' : ''}</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{totalVariance.toLocaleString()} ETB</span>
            <span className="finance-stat-label">Total Variance</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-red">
            <span style={{ fontSize: 18 }}>!</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{overBudgetCount}</span>
            <span className="finance-stat-label">Over Budget Items</span>
          </div>
        </div>
      </div>

      <div className="finance-toolbar">
        <select
          className="finance-filter-select"
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
        >
          {periods.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Cost Center</th>
              <th>Category</th>
              <th>Budget (ETB)</th>
              <th>Actual (ETB)</th>
              <th>Variance</th>
              <th>Variance %</th>
              <th>Status</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((budget) => {
              const pct = budget.budget_amount > 0
                ? (budget.actual_amount / budget.budget_amount) * 100
                : 0;
              return (
                <tr key={budget.id}>
                  <td className="finance-table-name">{budget.cost_center}</td>
                  <td>{budget.category}</td>
                  <td>{budget.budget_amount.toLocaleString()}</td>
                  <td>{budget.actual_amount.toLocaleString()}</td>
                  <td className={budget.variance >= 0 ? 'finance-text-green' : 'finance-text-red'}>
                    {budget.variance >= 0 ? '+' : ''}{budget.variance.toLocaleString()}
                  </td>
                  <td className={budget.variance_pct >= 0 ? 'finance-text-green' : 'finance-text-red'}>
                    {budget.variance_pct >= 0 ? '+' : ''}{budget.variance_pct.toFixed(1)}%
                  </td>
                  <td>
                    <span className={`finance-badge ${budget.status === 'within_budget' ? 'finance-badge-green' : budget.status === 'over_budget' ? 'finance-badge-red' : 'finance-badge-amber'}`}>
                      {budget.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ minWidth: 100 }}>
                    <div className="finance-budget-progress">
                      <div
                        className={`finance-budget-bar ${pct > 100 ? 'finance-budget-bar-over' : pct > 85 ? 'finance-budget-bar-warn' : 'finance-budget-bar-ok'}`}
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
    </section>
  );
}
