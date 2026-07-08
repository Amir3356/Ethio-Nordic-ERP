import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { useHR } from './hooks';

type HRHook = ReturnType<typeof useHR>;

interface Props {
  hr: HRHook;
}

export default function AttendanceTracking({ hr }: Props) {
  const { data, getEmployee } = hr;
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('2026-07-01');
  const [statusFilter, setStatusFilter] = useState('all');

  const dates = useMemo(() => {
    return [...new Set(data.attendance.map((a) => a.date))].sort().reverse();
  }, [data]);

  const attendance = useMemo(() => {
    let filtered = data.attendance.filter((a) => a.date === dateFilter);
    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((a) => {
        const emp = getEmployee(a.employee_id);
        return emp &&
          (emp.first_name.toLowerCase().includes(q) ||
           emp.last_name.toLowerCase().includes(q) ||
           emp.employee_id.toLowerCase().includes(q));
      });
    }
    return filtered;
  }, [data, search, dateFilter, statusFilter, getEmployee]);

  const todayStats = useMemo(() => {
    const today = data.attendance.filter((a) => a.date === dateFilter);
    return {
      present: today.filter((a) => a.status === 'Present').length,
      late: today.filter((a) => a.status === 'Late').length,
      absent: today.filter((a) => a.status === 'Absent').length,
      halfDay: today.filter((a) => a.status === 'Half Day').length,
      overtime: today.reduce((sum, a) => sum + a.overtime_hours, 0),
    };
  }, [data, dateFilter]);

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'Present' ? 'hr-badge-green' :
      status === 'Late' ? 'hr-badge-amber' :
      status === 'Absent' ? 'hr-badge-red' :
      status === 'Half Day' ? 'hr-badge-blue' :
      'hr-badge-gray';
    return <span className={`hr-badge ${cls}`}>{status}</span>;
  };

  return (
    <section className="content-section" id="attendance-tracking">
      <div className="content-section-header">
        <h2>Attendance Tracking</h2>
      </div>

      <p className="content-description">
        Daily attendance capture and exception tracking via biometric/card integration or manual entry.
      </p>

      <div className="hr-stats-grid">
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-green">
            <span style={{ fontSize: 18 }}>{todayStats.present}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{todayStats.present}</span>
            <span className="hr-stat-label">Present</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-amber">
            <span style={{ fontSize: 18 }}>{todayStats.late}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{todayStats.late}</span>
            <span className="hr-stat-label">Late Arrivals</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-red">
            <span style={{ fontSize: 18 }}>{todayStats.absent}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{todayStats.absent}</span>
            <span className="hr-stat-label">Absent</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-purple">
            <span style={{ fontSize: 18 }}>{todayStats.overtime.toFixed(1)}h</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{todayStats.overtime.toFixed(1)}h</span>
            <span className="hr-stat-label">Total Overtime</span>
          </div>
        </div>
      </div>

      <div className="hr-toolbar">
        <div className="hr-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="hr-filter-select"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          {dates.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          className="hr-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
          <option value="Absent">Absent</option>
          <option value="Half Day">Half Day</option>
        </select>
      </div>

      <div className="hr-table-wrapper">
        <table className="hr-table">
          <thead>
            <tr>
              <th>Emp ID</th>
              <th>Employee</th>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Hours</th>
              <th>Overtime</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((att) => {
              const emp = getEmployee(att.employee_id);
              return (
                <tr key={att.id}>
                  <td className="hr-table-name">{emp?.employee_id}</td>
                  <td>{emp?.first_name} {emp?.last_name}</td>
                  <td>{att.date}</td>
                  <td>{att.check_in || <span className="hr-text-muted">—</span>}</td>
                  <td>{att.check_out || <span className="hr-text-muted">—</span>}</td>
                  <td>{att.hours_worked > 0 ? att.hours_worked.toFixed(1) : <span className="hr-text-muted">—</span>}</td>
                  <td>{att.overtime_hours > 0 ? <span className="hr-text-green">+{att.overtime_hours}h</span> : '—'}</td>
                  <td>{getStatusBadge(att.status)}</td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.notes || '—'}</td>
                </tr>
              );
            })}
            {attendance.length === 0 && (
              <tr><td colSpan={9} className="hr-empty">No attendance records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
