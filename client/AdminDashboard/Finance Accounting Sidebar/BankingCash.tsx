import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { useFinance } from './hooks';

type FinanceHook = ReturnType<typeof useFinance>;

interface Props {
  finance: FinanceHook;
}

export default function BankingCash({ finance }: Props) {
  const { data, getUnreconciledTransactions } = finance;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [reconciledFilter, setReconciledFilter] = useState('all');

  const transactions = useMemo(() => {
    if (!data) return [];
    let filtered = [...data.bank_transactions];
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }
    if (reconciledFilter !== 'all') {
      filtered = filtered.filter((t) =>
        reconciledFilter === 'reconciled' ? t.reconciled : !t.reconciled
      );
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((t) =>
        t.description.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, search, typeFilter, reconciledFilter]);

  const unreconciled = getUnreconciledTransactions();
  if (!data) return null;

  return (
    <section className="content-section" id="banking-cash">
      <div className="content-section-header">
        <h2>Banking & Cash Management</h2>
      </div>

      <p className="content-description">
        Bank account reconciliation and cash flow tracking across multi-currency accounts.
      </p>

      <div className="finance-stats-grid">
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-blue">
            <span style={{ fontSize: 18 }}>CBE</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">21,040,000 ETB</span>
            <span className="finance-stat-label">Primary Operating (CBE)</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-green">
            <span style={{ fontSize: 18 }}>USD</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">5,253,300 USD</span>
            <span className="finance-stat-label">USD Correspondent (CBE)</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-purple">
            <span style={{ fontSize: 18 }}>EUR</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">EUR Account</span>
            <span className="finance-stat-label">Trade Account (Dashen)</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-amber">
            <span style={{ fontSize: 18 }}>!</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{unreconciled.length}</span>
            <span className="finance-stat-label">Unreconciled Items</span>
          </div>
        </div>
      </div>

      <div className="finance-toolbar">
        <div className="finance-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by description, reference..."
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
          <option value="debit">Debits</option>
          <option value="credit">Credits</option>
        </select>
        <select
          className="finance-filter-select"
          value={reconciledFilter}
          onChange={(e) => setReconciledFilter(e.target.value)}
        >
          <option value="all">All Reconciliation</option>
          <option value="reconciled">Reconciled</option>
          <option value="unreconciled">Unreconciled</option>
        </select>
      </div>

      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance After</th>
              <th>Reference</th>
              <th>Reconciled</th>
              <th>Reconciled Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id}>
                <td className="finance-table-name">{txn.id}</td>
                <td>{txn.date}</td>
                <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>{txn.description}</td>
                <td>
                  <span className={`finance-badge ${txn.type === 'credit' ? 'finance-badge-green' : 'finance-badge-red'}`}>
                    {txn.type}
                  </span>
                </td>
                <td className={txn.type === 'credit' ? 'finance-text-green' : 'finance-text-red'}>
                  {txn.type === 'credit' ? '+' : '-'}{txn.amount.toLocaleString()}
                </td>
                <td className="finance-text-bold">{txn.balance_after.toLocaleString()}</td>
                <td>{txn.reference}</td>
                <td>
                  <span className={`finance-badge ${txn.reconciled ? 'finance-badge-green' : 'finance-badge-amber'}`}>
                    {txn.reconciled ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>{txn.reconciled_date || <span className="finance-text-muted">—</span>}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={9} className="finance-empty">No transactions found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
