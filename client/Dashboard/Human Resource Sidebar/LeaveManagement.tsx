import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { useHR } from './hooks';

type HRHook = ReturnType<typeof useHR>;

interface Props {
  hr: HRHook;
}

export default function LeaveManagement({ hr }: Props) {
  const { data, getEmployee, getPendingLeaveRequests } = hr;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tab, setTab] = useState<'requests' | 'balances'>('requests');

  const leaveRequests = useMemo(() => {
    let filtered = [...data.leave_requests];
    if (statusFilter !== 'all') {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((l) => {
        const emp = getEmployee(l.employee_id);
        return emp &&
          (emp.first_name.toLowerCase().includes(q) ||
           emp.last_name.toLowerCase().includes(q) ||
           emp.employee_id.toLowerCase().includes(q));
      });
    }
    return filtered.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  }, [data, search, statusFilter, getEmployee]);

  const pendingCount = getPendingLeaveRequests().length;

  const ANNUAL_ENTITLEMENT = 24;
  const SICK_ENTITLEMENT = 12;

  const leaveBalances = useMemo(() => {
    const approved = data.leave_requests.filter((l) => l.status === 'Approved');
    return data.employees.map((emp) => {
      const takenFor = (type: string) =>
        approved
          .filter((l) => l.employee_id === emp.employee_id && l.leave_type === type)
          .reduce((sum, l) => sum + l.days, 0);
      const annualTaken = takenFor('Annual');
      const sickTaken = takenFor('Sick');
      return {
        employee_id: emp.employee_id,
        annual_entitled: ANNUAL_ENTITLEMENT,
        annual_taken: annualTaken,
        annual_remaining: ANNUAL_ENTITLEMENT - annualTaken,
        sick_entitled: SICK_ENTITLEMENT,
        sick_taken: sickTaken,
        sick_remaining: SICK_ENTITLEMENT - sickTaken,
      };
    });
  }, [data]);

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'Approved' ? 'hr-badge-green' :
      status === 'Pending' ? 'hr-badge-amber' :
      status === 'Rejected' ? 'hr-badge-red' :
      'hr-badge-gray';
    return <span className={`hr-badge ${cls}`}>{status}</span>;
  };

  const getLeaveTypeBadge = (type: string) => {
    const cls =
      type === 'Annual' ? 'hr-badge-blue' :
      type === 'Sick' ? 'hr-badge-red' :
      type === 'Maternity' ? 'hr-badge-pink' :
      type === 'Bereavement' ? 'hr-badge-gray' :
      'hr-badge-purple';
    return <span className={`hr-badge ${cls}`}>{type}</span>;
  };

  return (
    <section className="content-section" id="leave-management">
      <div className="content-section-header">
        <h2>Leave Management</h2>
      </div>

      <p className="content-description">
        Leave request, approval, and balance tracking with real-time balance validation.
      </p>

      <div className="hr-stats-grid">
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-amber">
            <span style={{ fontSize: 18 }}>{pendingCount}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{pendingCount}</span>
            <span className="hr-stat-label">Pending Requests</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-green">
            <span style={{ fontSize: 18 }}>{data.leave_requests.filter((l) => l.status === 'Approved').length}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{data.leave_requests.filter((l) => l.status === 'Approved').length}</span>
            <span className="hr-stat-label">Approved</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-blue">
            <span style={{ fontSize: 18 }}>{data.leave_requests.length}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{data.leave_requests.length}</span>
            <span className="hr-stat-label">Total Requests</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-red">
            <span style={{ fontSize: 18 }}>{data.leave_requests.filter((l) => l.status === 'Rejected').length}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{data.leave_requests.filter((l) => l.status === 'Rejected').length}</span>
            <span className="hr-stat-label">Rejected</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`hr-badge ${tab === 'requests' ? 'hr-badge-blue' : 'hr-badge-gray'}`}
          style={{ cursor: 'pointer', padding: '8px 16px', fontSize: 13 }}
        >
          Leave Requests
        </button>
        <button
          type="button"
          onClick={() => setTab('balances')}
          className={`hr-badge ${tab === 'balances' ? 'hr-badge-blue' : 'hr-badge-gray'}`}
          style={{ cursor: 'pointer', padding: '8px 16px', fontSize: 13 }}
        >
          Leave Balances
        </button>
      </div>

      {tab === 'requests' && (
        <>
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="hr-table-wrapper">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Approved By</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((lr) => {
                  const emp = getEmployee(lr.employee_id);
                  const approver = lr.approved_by ? getEmployee(lr.approved_by) : null;
                  return (
                    <tr key={lr.id}>
                      <td className="hr-table-name">{lr.id}</td>
                      <td>{emp?.first_name} {emp?.last_name}</td>
                      <td>{getLeaveTypeBadge(lr.leave_type)}</td>
                      <td>{lr.start_date}</td>
                      <td>{lr.end_date}</td>
                      <td className="hr-text-bold">{lr.days}</td>
                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{lr.reason}</td>
                      <td>{getStatusBadge(lr.status)}</td>
                      <td>{approver ? `${approver.first_name} ${approver.last_name}` : '—'}</td>
                    </tr>
                  );
                })}
                {leaveRequests.length === 0 && (
                  <tr><td colSpan={9} className="hr-empty">No leave requests found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'balances' && (
        <div className="hr-table-wrapper">
          <table className="hr-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Annual Entitled</th>
                <th>Annual Taken</th>
                <th>Annual Remaining</th>
                <th>Sick Entitled</th>
                <th>Sick Taken</th>
                <th>Sick Remaining</th>
              </tr>
            </thead>
            <tbody>
              {leaveBalances.map((lb) => {
                const emp = getEmployee(lb.employee_id);
                return (
                  <tr key={lb.employee_id}>
                    <td className="hr-table-name">{emp?.first_name} {emp?.last_name}</td>
                    <td>{lb.annual_entitled}</td>
                    <td>{lb.annual_taken}</td>
                    <td className={lb.annual_remaining < 5 ? 'hr-text-red' : 'hr-text-green'}>{lb.annual_remaining}</td>
                    <td>{lb.sick_entitled}</td>
                    <td>{lb.sick_taken}</td>
                    <td className={lb.sick_remaining < 3 ? 'hr-text-red' : 'hr-text-green'}>{lb.sick_remaining}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
