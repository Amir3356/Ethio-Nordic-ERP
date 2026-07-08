import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { useHR } from './hooks';

type HRHook = ReturnType<typeof useHR>;

interface Props {
  hr: HRHook;
}

export default function EmployeeRecords({ hr }: Props) {
  const { data, departments } = hr;
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const departmentsList = useMemo(() => {
    return [...new Set(data.employees.map((e) => e.department))];
  }, [data]);

  const employees = useMemo(() => {
    let filtered = [...data.employees];
    if (deptFilter !== 'all') {
      filtered = filtered.filter((e) => e.department === deptFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.employment_status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((e) =>
        e.first_name.toLowerCase().includes(q) ||
        e.last_name.toLowerCase().includes(q) ||
        e.employee_id.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [data, search, deptFilter, statusFilter]);

  const activeCount = data.employees.filter((e) => e.employment_status === 'Active').length;
  const maleCount = data.employees.filter((e) => e.gender === 'Male' && e.employment_status === 'Active').length;
  const femaleCount = data.employees.filter((e) => e.gender === 'Female' && e.employment_status === 'Active').length;

  const getStatusBadge = (status: string) => {
    const cls =
      status === 'Active' ? 'hr-badge-green' :
      status === 'On Leave' ? 'hr-badge-amber' :
      status === 'Terminated' ? 'hr-badge-red' :
      'hr-badge-gray';
    return <span className={`hr-badge ${cls}`}>{status}</span>;
  };

  const avatarColors = ['#4f46e5', '#059669', '#dc2626', '#d97706', '#7c3aed', '#0d9488', '#db2777', '#2563eb'];

  return (
    <section className="content-section" id="employee-records">
      <div className="content-section-header">
        <h2>Employee Records</h2>
      </div>

      <p className="content-description">
        Centralized personnel data and employment history for all Ethio Nordic Trading PLC staff.
      </p>

      <div className="hr-stats-grid">
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-blue">
            <span style={{ fontSize: 18 }}>{activeCount}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{activeCount}</span>
            <span className="hr-stat-label">Active Employees</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-indigo">
            <span style={{ fontSize: 18 }}>{departments.length}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{departments.length}</span>
            <span className="hr-stat-label">Departments</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-teal">
            <span style={{ fontSize: 18 }}>M:{maleCount}</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{maleCount} / {femaleCount}</span>
            <span className="hr-stat-label">Male / Female</span>
          </div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-icon hr-stat-icon-purple">
            <span style={{ fontSize: 18 }}>$</span>
          </div>
          <div className="hr-stat-body">
            <span className="hr-stat-value">{data.employees.filter((e) => e.employment_status === 'Active').reduce((s, e) => s + e.base_salary_etb, 0).toLocaleString()}</span>
            <span className="hr-stat-label">Total Monthly Salary</span>
          </div>
        </div>
      </div>

      <div className="hr-toolbar">
        <div className="hr-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, ID, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="hr-filter-select"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="all">All Departments</option>
          {departmentsList.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          className="hr-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="On Leave">On Leave</option>
          <option value="Terminated">Terminated</option>
        </select>
      </div>

      <div className="hr-table-wrapper">
        <table className="hr-table">
          <thead>
            <tr>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Position</th>
              <th>Hire Date</th>
              <th>Contract</th>
              <th>Grade</th>
              <th>Salary (ETB)</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="hr-table-name">{emp.employee_id}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      className="hr-employee-avatar"
                      style={{ backgroundColor: avatarColors[emp.id.charCodeAt(4) % avatarColors.length], width: 28, height: 28, fontSize: 11 }}
                    >
                      {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                    </div>
                    <div>
                      <div className="hr-table-name">{emp.first_name} {emp.last_name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td>{emp.department}</td>
                <td>{emp.position}</td>
                <td>{emp.hire_date}</td>
                <td>
                  <span className={`hr-badge ${emp.contract_type === 'Permanent' ? 'hr-badge-green' : emp.contract_type === 'Contract' ? 'hr-badge-blue' : 'hr-badge-amber'}`}>
                    {emp.contract_type}
                  </span>
                </td>
                <td>{emp.salary_grade}</td>
                <td className="hr-text-bold">{emp.base_salary_etb.toLocaleString()}</td>
                <td>{emp.location}</td>
                <td>{getStatusBadge(emp.employment_status)}</td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={10} className="hr-empty">No employees found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
