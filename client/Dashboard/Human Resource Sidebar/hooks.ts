import { useState, useEffect, useCallback } from 'react';
import { hrAPI } from '../../services/hr';
import type { HRData } from './types';

export function useHR() {
  const [data, setData] = useState<HRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await hrAPI.getOverview();
      const payload = response.data?.data ?? response.data;
      setData({
        employees: payload.employees ?? [],
        attendance: payload.attendance ?? [],
        leave_requests: payload.leave_requests ?? [],
        payroll: payload.payroll ?? [],
        performance_reviews: payload.performance_reviews ?? [],
        training_records: payload.training_records ?? [],
        employee_documents: payload.employee_documents ?? [],
        departments: payload.departments ?? [],
      });
      setError('');
    } catch (err) {
      setError('Failed to load HR data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getEmployee = useCallback(
    (id: string) => data?.employees.find((e) => e.id === id),
    [data]
  );

  const getActiveEmployees = useCallback(
    () => data?.employees.filter((e) => e.employment_status === 'Active') ?? [],
    [data]
  );

  const getPendingLeaveRequests = useCallback(
    () => data?.leave_requests.filter((l) => l.status === 'Pending') ?? [],
    [data]
  );

  const getDraftPayroll = useCallback(
    () => data?.payroll.filter((p) => p.status === 'Draft') ?? [],
    [data]
  );

  const getExpiringDocuments = useCallback(
    () => data?.employee_documents.filter((d) => d.status === 'Expiring Soon' || d.status === 'Expired') ?? [],
    [data]
  );

  const getUpcomingTrainings = useCallback(
    () => data?.training_records.filter((t) => t.status === 'Scheduled') ?? [],
    [data]
  );

  const getTotalPayroll = data?.payroll
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + p.net_salary, 0) ?? 0;

  const getAveragePerformanceScore = data?.performance_reviews.length
    ? data.performance_reviews.reduce((sum, r) => sum + r.final_score, 0) / data.performance_reviews.length
    : 0;

  const totalHeadcount = data?.employees.filter((e) => e.employment_status === 'Active').length ?? 0;

  const departments = data?.departments ?? [];

  return {
    data,
    loading,
    error,
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
    refetch: fetchData,
  };
}
