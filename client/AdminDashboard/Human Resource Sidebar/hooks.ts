import { useMemo, useCallback } from 'react';
import hrData from '../data/human-resource.json';
import type { HRData, Employee, Attendance, LeaveRequest, PayrollRecord, EmployeeDocument, TrainingRecord } from './types';

export function useHR() {
  const data = hrData as HRData;

  const getEmployee = useCallback((id: string): Employee | undefined => {
    return data.employees.find((e) => e.id === id);
  }, [data]);

  const getEmployeeByEmpId = useCallback((empId: string): Employee | undefined => {
    return data.employees.find((e) => e.employee_id === empId);
  }, [data]);

  const getEmployeesByDepartment = useCallback((department: string): Employee[] => {
    return data.employees.filter((e) => e.department === department);
  }, [data]);

  const getAttendanceByEmployee = useCallback((employeeId: string): Attendance[] => {
    return data.attendance.filter((a) => a.employee_id === employeeId);
  }, [data]);

  const getLeaveRequestsByEmployee = useCallback((employeeId: string): LeaveRequest[] => {
    return data.leave_requests.filter((l) => l.employee_id === employeeId);
  }, [data]);

  const getPayrollByEmployee = useCallback((employeeId: string): PayrollRecord[] => {
    return data.payroll.filter((p) => p.employee_id === employeeId);
  }, [data]);

  const getLeaveBalance = useCallback((employeeId: string) => {
    return data.leave_balances.find((l) => l.employee_id === employeeId);
  }, [data]);

  const getActiveEmployees = useCallback((): Employee[] => {
    return data.employees.filter((e) => e.employment_status === 'Active');
  }, [data]);

  const getPendingLeaveRequests = useCallback((): LeaveRequest[] => {
    return data.leave_requests.filter((l) => l.status === 'Pending');
  }, [data]);

  const getDraftPayroll = useCallback((): PayrollRecord[] => {
    return data.payroll.filter((p) => p.status === 'Draft');
  }, [data]);

  const getExpiringDocuments = useCallback((): EmployeeDocument[] => {
    return data.employee_documents.filter(
      (d) => d.status === 'Expiring Soon' || d.status === 'Expired'
    );
  }, [data]);

  const getUpcomingTrainings = useCallback((): TrainingRecord[] => {
    return data.training_records.filter((t) => t.status === 'Scheduled');
  }, [data]);

  const getTotalPayroll = useMemo(() => {
    return data.payroll
      .filter((p) => p.status === 'Paid')
      .reduce((sum, p) => sum + p.net_salary, 0);
  }, [data]);

  const getAveragePerformanceScore = useMemo(() => {
    if (data.performance_reviews.length === 0) return 0;
    const total = data.performance_reviews.reduce((sum, r) => sum + r.final_score, 0);
    return total / data.performance_reviews.length;
  }, [data]);

  const totalHeadcount = data.employees.filter((e) => e.employment_status === 'Active').length;

  const departments = useMemo(() => {
    return data.departments.map((dept) => ({
      ...dept,
      head: getEmployee(dept.head_id),
    }));
  }, [data, getEmployee]);

  return {
    data,
    loading: false,
    error: '',
    getEmployee,
    getEmployeeByEmpId,
    getEmployeesByDepartment,
    getAttendanceByEmployee,
    getLeaveRequestsByEmployee,
    getPayrollByEmployee,
    getLeaveBalance,
    getActiveEmployees,
    getPendingLeaveRequests,
    getDraftPayroll,
    getExpiringDocuments,
    getUpcomingTrainings,
    getTotalPayroll,
    getAveragePerformanceScore,
    totalHeadcount,
    departments,
  };
}
