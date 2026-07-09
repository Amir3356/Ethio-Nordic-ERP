import { useMemo, useCallback } from 'react';
import hrData from '../data/human-resource.json';
import type { HRData, Employee, LeaveRequest, PayrollRecord, EmployeeDocument, TrainingRecord } from './types';

export function useHR() {
  const data = hrData as HRData;

  const getEmployee = useCallback((id: string): Employee | undefined => {
    return data.employees.find((e) => e.id === id);
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
