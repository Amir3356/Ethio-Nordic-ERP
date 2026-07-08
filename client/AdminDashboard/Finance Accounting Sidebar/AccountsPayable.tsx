import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { useFinance } from './hooks';

type FinanceHook = ReturnType<typeof useFinance>;

interface Props {
  finance: FinanceHook;
}

export default function AccountsPayable({ finance }: Props) {
  const { data, getTotalAPBalance } = finance;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const invoices = useMemo(() => {
    if (!data) return [];
    let filtered = [...data.ap_invoices];
    if (statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((i) =>
        i.supplier_name.toLowerCase().includes(q) ||
        i.invoice_no.toLowerCase().includes(q) ||
        i.po_ref.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
  }, [data, search, statusFilter]);

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'paid' ? 'finance-badge-green' :
      status === 'partially_paid' ? 'finance-badge-blue' :
      status === 'approved' ? 'finance-badge-purple' :
      status === 'pending_approval' ? 'finance-badge-amber' :
      status === 'overdue' ? 'finance-badge-red' :
      'finance-badge-gray';
    return <span className={`finance-badge ${cls}`}>{status.replace('_', ' ')}</span>;
  };

  if (!data) return null;

  return (
    <section className="content-section" id="accounts-payable">
      <div className="content-section-header">
        <h2>Accounts Payable</h2>
      </div>

      <p className="content-description">
        Supplier invoice processing with three-way match (PO, GRN, Invoice) and payment tracking.
      </p>

      <div className="finance-stats-grid">
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-blue">
            <span style={{ fontSize: 18 }}>AP</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{data.ap_invoices.length}</span>
            <span className="finance-stat-label">Total Invoices</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-green">
            <span style={{ fontSize: 18 }}>$</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{getTotalAPBalance.toLocaleString()} ETB</span>
            <span className="finance-stat-label">Outstanding Balance</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-amber">
            <span style={{ fontSize: 18 }}>!</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{data.ap_invoices.filter((i) => i.status === 'pending_approval').length}</span>
            <span className="finance-stat-label">Pending Approval</span>
          </div>
        </div>
        <div className="finance-stat-card">
          <div className="finance-stat-icon finance-stat-icon-red">
            <span style={{ fontSize: 18 }}>X</span>
          </div>
          <div className="finance-stat-body">
            <span className="finance-stat-value">{data.ap_invoices.filter((i) => !i.matched_grn).length}</span>
            <span className="finance-stat-label">GRN Pending</span>
          </div>
        </div>
      </div>

      <div className="finance-toolbar">
        <div className="finance-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by supplier, invoice, PO..."
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
          <option value="partially_paid">Partially Paid</option>
          <option value="approved">Approved</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Supplier</th>
              <th>Invoice No</th>
              <th>PO Ref</th>
              <th>GRN Ref</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>VAT</th>
              <th>Total (ETB)</th>
              <th>Status</th>
              <th>Match</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="finance-table-name">{inv.id}</td>
                <td>{inv.supplier_name}</td>
                <td>{inv.invoice_no}</td>
                <td>{inv.po_ref}</td>
                <td>{inv.grn_ref || <span className="finance-text-muted">—</span>}</td>
                <td>{inv.invoice_date}</td>
                <td>{inv.due_date}</td>
                <td>{inv.amount.toLocaleString()} {inv.currency}</td>
                <td>{inv.vat_amount.toLocaleString()} {inv.currency}</td>
                <td className="finance-text-bold">{inv.amount_etb.toLocaleString()}</td>
                <td>{getStatusBadge(inv.status)}</td>
                <td>
                  <span className={`finance-badge ${inv.matched_po && inv.matched_grn ? 'finance-badge-green' : 'finance-badge-amber'}`}>
                    {inv.matched_po && inv.matched_grn ? '3-Way' : inv.matched_po ? 'PO Only' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={12} className="finance-empty">No AP invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
