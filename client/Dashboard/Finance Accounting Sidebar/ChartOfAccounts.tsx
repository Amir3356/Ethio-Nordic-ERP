import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { useFinance } from './hooks';

type FinanceHook = ReturnType<typeof useFinance>;

interface Props {
  finance: FinanceHook;
}

export default function ChartOfAccounts({ finance }: Props) {
  const { data, getChildAccounts } = finance;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

  const filteredAccounts = useMemo(() => {
    if (!data) return [];
    let accounts = data.chart_of_accounts;
    if (typeFilter !== 'all') {
      accounts = accounts.filter((a) => a.type === typeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      accounts = accounts.filter((a) =>
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q)
      );
    }
    return accounts;
  }, [data, search, typeFilter]);

  const rootAccounts = useMemo(() => {
    return filteredAccounts.filter((a) => a.parent_id === null);
  }, [filteredAccounts]);

  if (!data) return null;

  return (
    <section className="content-section" id="chart-of-accounts">
      <div className="content-section-header">
        <h2>Chart of Accounts</h2>
      </div>

      <p className="content-description">
        Configurable, hierarchical account structure aligned with Ethiopian statutory reporting requirements.
      </p>

      <div className="finance-toolbar">
        <div className="finance-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="finance-filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {accountTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="finance-coa-tree">
        {rootAccounts.map((account) => {
          const children = getChildAccounts(account.id);
          const typeColors: Record<string, string> = {
            'Asset': 'inv-stat-icon-blue',
            'Liability': 'inv-stat-icon-red',
            'Equity': 'inv-stat-icon-purple',
            'Revenue': 'inv-stat-icon-green',
            'Expense': 'inv-stat-icon-amber',
          };
          return (
            <div key={account.id} className="finance-coa-type-group">
              <div className="finance-coa-type-header">
                <div className={`finance-stat-icon ${typeColors[account.type] || 'inv-stat-icon-blue'}`} style={{ width: 24, height: 24 }}>
                  <span style={{ fontSize: 10 }}>{account.type.charAt(0)}</span>
                </div>
                <span>{account.name}</span>
                <span className="finance-badge finance-badge-gray">{account.code}</span>
              </div>
              {children.map((child) => (
                <div key={child.id} className="finance-coa-account">
                  <span className="finance-coa-account-code">{child.code}</span>
                  <span>{child.name}</span>
                  {child.cost_center && (
                    <span className="finance-badge finance-badge-blue">{child.cost_center}</span>
                  )}
                  <span className="finance-badge finance-badge-gray">{child.currency}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
