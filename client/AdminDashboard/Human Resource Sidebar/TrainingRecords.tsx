import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { useHR } from './hooks';

type HRHook = ReturnType<typeof useHR>;

interface Props {
  hr: HRHook;
}

export default function TrainingRecords({ hr }: Props) {
  const { data, getEmployee, getUpcomingTrainings } = hr;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const trainings = useMemo(() => {
    let filtered = [...data.training_records];
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((t) => {
        const emp = getEmployee(t.employee_id);
        return emp &&
          (emp.first_name.toLowerCase().includes(q) ||
           emp.last_name.toLowerCase().includes(q) ||
           t.training_name.toLowerCase().includes(q));
      });
    }
    return filtered.sort((a, b) => new Date(b.training_date).getTime() - new Date(a.training_date).getTime());
  }, [data, search, statusFilter, getEmployee]);

  const upcomingCount = getUpcomingTrainings().length;
  const certifiedCount = data.training_records.filter((t) => t.certification).length;

  const expiringCerts = useMemo(() => {
    const now = new Date();
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    return data.training_records.filter(
      (t) => t.cert_expiry && new Date(t.cert_expiry) <= ninetyDays && new Date(t.cert_expiry) >= now
    );
  }, [data]);

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'Completed' ? 'hr-badge-green' :
      status === 'Scheduled' ? 'hr-badge-blue' :
      status === 'Cancelled' ? 'hr-badge-red' :
      'hr-badge-gray';
    return <span className={`hr-badge ${cls}`}>{status}</span>;
  };

  return (
    <section className="content-section" id="training-records">
      <div className="content-section-header">
        <h2>Training Records</h2>
      </div>

      <p className="content-description">
        Training history, certification tracking, and automated renewal reminders.
      </p>

      <div className="hr-stats-grid">
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-blue">
            <span style={{ fontSize: 18 }}>{data.training_records.length}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{data.training_records.length}</span>
            <span className="hr-stat-label">Total Trainings</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-green">
            <span style={{ fontSize: 18 }}>{certifiedCount}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{certifiedCount}</span>
            <span className="hr-stat-label">Certifications</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-amber">
            <span style={{ fontSize: 18 }}>{upcomingCount}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{upcomingCount}</span>
            <span className="hr-stat-label">Upcoming</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-red">
            <span style={{ fontSize: 18 }}>{expiringCerts.length}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{expiringCerts.length}</span>
            <span className="hr-stat-label">Expiring Soon</span>
          </div>
        </div>
      </div>

      <div className="hr-toolbar">
        <div className="hr-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by employee or training..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="hr-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Completed">Completed</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="hr-table-wrapper">
        <table className="hr-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Training</th>
              <th>Provider</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Certification</th>
              <th>Cert Expiry</th>
              <th>Cost (ETB)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {trainings.map((t) => {
              const emp = getEmployee(t.employee_id);
              const isExpiringSoon = t.cert_expiry && new Date(t.cert_expiry) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
              return (
                <tr key={t.id}>
                  <td className="hr-table-name">{emp?.first_name} {emp?.last_name}</td>
                  <td>{t.training_name}</td>
                  <td>{t.provider}</td>
                  <td>{t.training_date}</td>
                  <td>{t.duration_days > 0 ? `${t.duration_days} days` : 'Online'}</td>
                  <td>{t.certification || <span className="hr-text-muted">—</span>}</td>
                  <td>
                    {t.cert_expiry ? (
                      <span className={isExpiringSoon ? 'hr-text-red' : ''}>{t.cert_expiry}</span>
                    ) : (
                      <span className="hr-text-muted">—</span>
                    )}
                  </td>
                  <td>{t.cost_etb > 0 ? t.cost_etb.toLocaleString() : <span className="hr-text-muted">Free</span>}</td>
                  <td>{getStatusBadge(t.status)}</td>
                </tr>
              );
            })}
            {trainings.length === 0 && (
              <tr><td colSpan={9} className="hr-empty">No training records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
