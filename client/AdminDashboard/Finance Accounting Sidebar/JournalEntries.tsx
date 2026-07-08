import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { useFinance } from './hooks';

type FinanceHook = ReturnType<typeof useFinance>;

interface Props {
  finance: FinanceHook;
}

export default function JournalEntries({ finance }: Props) {
  const { data, getJournalLines } = finance;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const entries = useMemo(() => {
    if (!data) return [];
    let filtered = [...data.journal_entries];
    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((e) =>
        e.description.toLowerCase().includes(q) ||
        e.reference.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, search, statusFilter]);

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'posted' ? 'finance-badge-green' :
      status === 'draft' ? 'finance-badge-gray' :
      'finance-badge-red';
    return <span className={`finance-badge ${cls}`}>{status}</span>;
  };

  const getSourceBadge = (source: string) => {
    const cls =
      source === 'System' ? 'finance-badge-blue' :
      source === 'Manual' ? 'finance-badge-purple' :
      source === 'Auto-approved' ? 'finance-badge-green' :
      'finance-badge-gray';
    return <span className={`finance-badge ${cls}`}>{source}</span>;
  };

  if (!data) return null;

  return (
    <section className="content-section" id="journal-entries">
      <div className="content-section-header">
        <h2>Journal Entries</h2>
      </div>

      <p className="content-description">
        Manual and system-generated double-entry postings with approval workflow.
      </p>

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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="posted">Posted</option>
          <option value="draft">Draft</option>
          <option value="reversed">Reversed</option>
        </select>
      </div>

      <div className="finance-table-wrapper">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Entry ID</th>
              <th>Date</th>
              <th>Description</th>
              <th>Source</th>
              <th>Reference</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Currency</th>
              <th>Status</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="finance-table-name">{entry.id}</td>
                <td>{entry.date}</td>
                <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.description}</td>
                <td>{getSourceBadge(entry.source_module)}</td>
                <td>{entry.reference}</td>
                <td className="finance-text-red">
                  {entry.total_debit.toLocaleString()} {entry.currency}
                </td>
                <td className="finance-text-green">
                  {entry.total_credit.toLocaleString()} {entry.currency}
                </td>
                <td>{entry.currency}</td>
                <td>{getStatusBadge(entry.status)}</td>
                <td>{entry.created_by}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={10} className="finance-empty">No journal entries found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
