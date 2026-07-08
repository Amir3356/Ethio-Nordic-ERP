import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { useHR } from './hooks';

type HRHook = ReturnType<typeof useHR>;

interface Props {
  hr: HRHook;
}

export default function EmployeeDocuments({ hr }: Props) {
  const { data, getEmployee, getExpiringDocuments } = hr;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const docTypes = useMemo(() => {
    return [...new Set(data.employee_documents.map((d) => d.document_type))];
  }, [data]);

  const documents = useMemo(() => {
    let filtered = [...data.employee_documents];
    if (typeFilter !== 'all') {
      filtered = filtered.filter((d) => d.document_type === typeFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((d) => {
        const emp = getEmployee(d.employee_id);
        return emp &&
          (emp.first_name.toLowerCase().includes(q) ||
           emp.last_name.toLowerCase().includes(q) ||
           d.document_name.toLowerCase().includes(q));
      });
    }
    return filtered.sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime());
  }, [data, search, typeFilter, statusFilter, getEmployee]);

  const expiringDocs = getExpiringDocuments();
  const activeCount = data.employee_documents.filter((d) => d.status === 'Active').length;
  const totalSize = data.employee_documents.reduce((s, d) => s + d.file_size_kb, 0);

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'Active' ? 'hr-badge-green' :
      status === 'Expired' ? 'hr-badge-red' :
      status === 'Expiring Soon' ? 'hr-badge-amber' :
      'hr-badge-gray';
    return <span className={`hr-badge ${cls}`}>{status}</span>;
  };

  const getTypeBadge = (type: string) => {
    const cls =
      type === 'Employment Contract' || type === 'Contract Renewal' ? 'hr-badge-blue' :
      type === 'ID Copy' ? 'hr-badge-purple' :
      type === 'Certification' ? 'hr-badge-green' :
      type === 'Driver License' ? 'hr-badge-teal' :
      'hr-badge-gray';
    return <span className={`hr-badge ${cls}`}>{type}</span>;
  };

  return (
    <section className="content-section" id="employee-documents">
      <div className="content-section-header">
        <h2>Employee Documents</h2>
      </div>

      <p className="content-description">
        Secure storage of contracts, IDs, and certifications with access restricted to authorized HR roles.
      </p>

      <div className="hr-stats-grid">
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-blue">
            <span style={{ fontSize: 18 }}>{data.employee_documents.length}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{data.employee_documents.length}</span>
            <span className="hr-stat-label">Total Documents</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-green">
            <span style={{ fontSize: 18 }}>{activeCount}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{activeCount}</span>
            <span className="hr-stat-label">Active</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-amber">
            <span style={{ fontSize: 18 }}>{expiringDocs.length}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{expiringDocs.length}</span>
            <span className="hr-stat-label">Expiring / Expired</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-purple">
            <span style={{ fontSize: 18 }}>{(totalSize / 1024).toFixed(1)}MB</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{(totalSize / 1024).toFixed(1)} MB</span>
            <span className="hr-stat-label">Storage Used</span>
          </div>
        </div>
      </div>

      <div className="hr-toolbar">
        <div className="hr-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by employee or document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="hr-filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {docTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          className="hr-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Expiring Soon">Expiring Soon</option>
        </select>
      </div>

      <div className="hr-table-wrapper">
        <table className="hr-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Document Type</th>
              <th>File Name</th>
              <th>Upload Date</th>
              <th>Expiry Date</th>
              <th>Size</th>
              <th>Access Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const emp = getEmployee(doc.employee_id);
              return (
                <tr key={doc.id}>
                  <td className="hr-table-name">{emp?.first_name} {emp?.last_name}</td>
                  <td>{getTypeBadge(doc.document_type)}</td>
                  <td>{doc.document_name}</td>
                  <td>{doc.upload_date}</td>
                  <td>{doc.expiry_date || <span className="hr-text-muted">—</span>}</td>
                  <td>{doc.file_size_kb} KB</td>
                  <td>{doc.access_level}</td>
                  <td>{getStatusBadge(doc.status)}</td>
                </tr>
              );
            })}
            {documents.length === 0 && (
              <tr><td colSpan={8} className="hr-empty">No documents found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
