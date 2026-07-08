import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { useFinance } from './hooks';

type FinanceHook = ReturnType<typeof useFinance>;

interface Props {
  finance: FinanceHook;
}

export default function AccountsReceivable({ finance }: Props) {
  const { data, getTotalARBalance, getOverdueARInvoices } = finance;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const invoices = useMemo(() => {
    if (!data) return [];
    let filtered = [...data.ar_invoices];
    if (statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((i) =>
        i.customer_name.toLowerCase().includes(q) ||
        i.invoice_no.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
  }, [data, search, statusFilter]);

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'paid' ? 'finance-badge-green' :
      status === 'overdue' ? 'finance-badge-red' :
      status === 'sent' ? 'finance-badge-blue' :
      status === 'written_off' ? 'finance-badge-gray' :
      'finance-badge-gray';
    return <span className={`finance-badge ${cls}`}>{status}</span>;
  };

  const overdueInvoices = getOverdueARInvoices();
  const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.total_amount, 0);

  if (!data) return null;

  return (
    <section className="content-section" id="accounts-receivable">
      <div className="content-section-header">
        <h2>Accounts Receivable</h2>
      </div>

      <p className="content-description">
        Customer invoice tracking with payment term management and automated collection reminders.
      </p>

      <div className="finance-stats-grid">
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-blue">
            <span style={{ fontSize: 18 }}>AR</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{data.ar_invoices.length}</span>
            <span className="finance-stat-label">Total Invoices</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-green">
            <span style={{ fontSize: 18 }}>$</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{getTotalARBalance.toLocaleString()} ETB</span>
            <span className="finance-stat-label">Outstanding Balance</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-red">
            <span style={{ fontSize: 18 }}>!</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{overdueInvoices.length}</span>
            <span className="finance-stat-label">Overdue Invoices</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-amber">
            <span style={{ fontSize: 18 }}>$</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{totalOverdue.toLocaleString()} ETB</span>
            <span className="finance-stat-label">Overdue Amount</span>
          </div>
        </div>
      </div>

      <div className="finance-toolbar">
        <div className="finance-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by customer, invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="finance-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="sent">Sent</option>
          <option value="overdue">Overdue</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Customer</th>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>VAT</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment Date</th>
              <th>Days Overdue</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="finance-table-name">{inv.id}</td>
                <td>{inv.customer_name}</td>
                <td>{inv.invoice_no}</td>
                <td>{inv.invoice_date}</td>
                <td>{inv.due_date}</td>
                <td>{inv.amount.toLocaleString()} {inv.currency}</td>
                <td>{inv.vat_amount.toLocaleString()}</td>
                <td className="finance-text-bold">{inv.total_amount.toLocaleString()} {inv.currency}</td>
                <td>{getStatusBadge(inv.status)}</td>
                <td>{inv.payment_date || <span className="finance-text-muted">—</span>}</td>
                <td>
                  {inv.days_overdue > 0 ? (
                    <span className="finance-text-red">{inv.days_overdue}d</span>
                  ) : (
                    <span className="finance-text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={11} className="finance-empty">No AR invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
