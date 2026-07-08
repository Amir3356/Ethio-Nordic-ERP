import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { useHR } from './hooks';

type HRHook = ReturnType<typeof useHR>;

interface Props {
  hr: HRHook;
}

export default function PayrollProcessing({ hr }: Props) {
  const { data, getEmployee, getDraftPayroll } = hr;
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('2026-06');
  const [statusFilter, setStatusFilter] = useState('all');

  const periods = useMemo(() => {
    return [...new Set(data.payroll.map((p) => p.pay_period))].sort().reverse();
  }, [data]);

  const payroll = useMemo(() => {
    let filtered = data.payroll.filter((p) => p.pay_period === periodFilter);
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) => {
        const emp = getEmployee(p.employee_id);
        return emp &&
          (emp.first_name.toLowerCase().includes(q) ||
           emp.last_name.toLowerCase().includes(q) ||
           emp.employee_id.toLowerCase().includes(q));
      });
    }
    return filtered;
  }, [data, search, periodFilter, statusFilter, getEmployee]);

  const periodStats = useMemo(() => {
    const periodPayroll = data.payroll.filter((p) => p.pay_period === periodFilter);
    return {
      totalGross: periodPayroll.reduce((s, p) => s + p.gross_salary, 0),
      totalDeductions: periodPayroll.reduce((s, p) => s + p.income_tax + p.pension_employee + p.other_deductions, 0),
      totalNet: periodPayroll.reduce((s, p) => s + p.net_salary, 0),
      totalPension: periodPayroll.reduce((s, p) => s + p.pension_employer, 0),
    };
  }, [data, periodFilter]);

  const draftCount = getDraftPayroll().length;

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'Paid' ? 'hr-badge-green' :
      status === 'Draft' ? 'hr-badge-amber' :
      status === 'Approved' ? 'hr-badge-blue' :
      status === 'On Leave' ? 'hr-badge-purple' :
      'hr-badge-gray';
    return <span className={`hr-badge ${cls}`}>{status}</span>;
  };

  return (
    <section className="content-section" id="payroll-processing">
      <div className="content-section-header">
        <h2>Payroll Processing</h2>
      </div>

      <p className="content-description">
        Salary computation, statutory deductions, and disbursement with automated financial posting.
      </p>

      <div className="hr-payroll-summary">
        <div className="hr-payroll-card">
          <div className="hr-payroll-value" style={{ color: '#059669' }}>{periodStats.totalGross.toLocaleString()}</div>
          <div className="hr-payroll-label">Gross Salary (ETB)</div>
        </div>
        <div className="hr-payroll-card">
          <div className="hr-payroll-value" style={{ color: '#dc2626' }}>{periodStats.totalDeductions.toLocaleString()}</div>
          <div className="hr-payroll-label">Total Deductions</div>
        </div>
        <div className="hr-payroll-card">
          <div className="hr-payroll-value" style={{ color: '#2563eb' }}>{periodStats.totalNet.toLocaleString()}</div>
          <div className="hr-payroll-label">Net Disbursement</div>
        </div>
        <div className="hr-payroll-card">
          <div className="hr-payroll-value" style={{ color: '#7c3aed' }}>{periodStats.totalPension.toLocaleString()}</div>
          <div className="hr-payroll-label">Employer Pension</div>
        </div>
      </div>

      <div className="hr-stats-grid">
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-green">
            <span style={{ fontSize: 18 }}>{data.payroll.filter((p) => p.pay_period === periodFilter && p.status === 'Paid').length}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{data.payroll.filter((p) => p.pay_period === periodFilter && p.status === 'Paid').length}</span>
            <span className="hr-stat-label">Paid</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-amber">
            <span style={{ fontSize: 18 }}>{draftCount}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{draftCount}</span>
            <span className="hr-stat-label">Draft (Pending)</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-purple">
            <span style={{ fontSize: 18 }}>{payroll.length}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{payroll.length}</span>
            <span className="hr-stat-label">This Period</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-blue">
            <span style={{ fontSize: 18 }}>$</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{data.payroll.filter((p) => p.payslip_generated && p.pay_period === periodFilter).length}</span>
            <span className="hr-stat-label">Payslips Generated</span>
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
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
        >
          {periods.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          className="hr-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Draft">Draft</option>
          <option value="Approved">Approved</option>
        </select>
      </div>

      <div className="hr-table-wrapper">
        <table className="hr-table">
          <thead>
            <tr>
              <th>Payroll ID</th>
              <th>Employee</th>
              <th>Base</th>
              <th>Overtime</th>
              <th>Allowances</th>
              <th>Gross</th>
              <th>Tax</th>
              <th>Pension</th>
              <th>Net Pay</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payroll.map((p) => {
              const emp = getEmployee(p.employee_id);
              return (
                <tr key={p.id}>
                  <td className="hr-table-name">{p.id}</td>
                  <td>{emp?.first_name} {emp?.last_name}</td>
                  <td>{p.base_salary.toLocaleString()}</td>
                  <td>{p.overtime_pay > 0 ? <span className="hr-text-green">+{p.overtime_pay.toLocaleString()}</span> : '—'}</td>
                  <td>{p.allowances.toLocaleString()}</td>
                  <td className="hr-text-bold">{p.gross_salary.toLocaleString()}</td>
                  <td className="hr-text-red">-{p.income_tax.toLocaleString()}</td>
                  <td className="hr-text-red">-{p.pension_employee.toLocaleString()}</td>
                  <td className="hr-text-bold">{p.net_salary.toLocaleString()}</td>
                  <td>{getStatusBadge(p.status)}</td>
                </tr>
              );
            })}
            {payroll.length === 0 && (
              <tr><td colSpan={10} className="hr-empty">No payroll records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
