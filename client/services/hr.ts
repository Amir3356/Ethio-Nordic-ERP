import { api } from './client';

export const hrAPI = {
  getOverview: () => api.get('/hr'),

  // Employees
  getEmployees: (params?: Record<string, string | number>) => api.get('/hr/employees', { params }),
  createEmployee: (data: Record<string, unknown>) => api.post('/hr/employees', data),
  updateEmployee: (id: string, data: Record<string, unknown>) => api.put(`/hr/employees/${id}`, data),
  getEmployee: (id: string) => api.get(`/hr/employees/${id}`),
  terminateEmployee: (id: string, data?: Record<string, unknown>) => api.post(`/hr/employees/${id}/terminate`, data),

  // Attendance
  getAttendance: (params?: Record<string, string | number>) => api.get('/hr/attendance', { params }),
  createAttendance: (data: Record<string, unknown>) => api.post('/hr/attendance', data),
  getAttendanceExceptions: () => api.get('/hr/attendance/exceptions'),
  resolveException: (id: string, data: Record<string, unknown>) => api.post(`/hr/attendance/${id}/resolve`, data),

  // Leave Requests
  getLeaveRequests: (params?: Record<string, string | number>) => api.get('/hr/leave-requests', { params }),
  createLeaveRequest: (data: Record<string, unknown>) => api.post('/hr/leave-requests', data),
  approveLeave: (id: string) => api.post(`/hr/leave-requests/${id}/approve`),
  rejectLeave: (id: string, data?: Record<string, unknown>) => api.post(`/hr/leave-requests/${id}/reject`, data),

  // Payroll
  getPayrollRuns: (params?: Record<string, string | number>) => api.get('/hr/payroll-runs', { params }),
  generatePayroll: (data: Record<string, unknown>) => api.post('/hr/payroll-runs', data),
  approvePayroll: (id: string) => api.post(`/hr/payroll-runs/${id}/approve`),
  markPayrollPaid: (id: string) => api.post(`/hr/payroll-runs/${id}/pay`),
  getPayslips: (params?: Record<string, string | number>) => api.get('/hr/payslips', { params }),

  // Performance Reviews
  getPerformanceReviews: (params?: Record<string, string | number>) => api.get('/hr/performance-reviews', { params }),
  createPerformanceReview: (data: Record<string, unknown>) => api.post('/hr/performance-reviews', data),
  submitSelfAssessment: (id: string, data: Record<string, unknown>) => api.post(`/hr/performance-reviews/${id}/self-assessment`, data),
  submitManagerReview: (id: string, data: Record<string, unknown>) => api.post(`/hr/performance-reviews/${id}/manager-review`, data),

  // Trainings
  getTrainings: (params?: Record<string, string | number>) => api.get('/hr/trainings', { params }),
  createTraining: (data: Record<string, unknown>) => api.post('/hr/trainings', data),
  updateTraining: (id: string, data: Record<string, unknown>) => api.put(`/hr/trainings/${id}`, data),
  getExpiringCertifications: () => api.get('/hr/trainings/expiring-certifications'),

  // Documents
  getDocuments: (params?: Record<string, string | number>) => api.get('/hr/documents', { params }),
  createDocument: (data: FormData) => api.post('/hr/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteDocument: (id: string) => api.delete(`/hr/documents/${id}`),
  downloadDocument: (id: string) => api.get(`/hr/documents/${id}/download`, { responseType: 'blob' }),
  getDocumentUrl: (id: string) => api.get(`/hr/documents/${id}/url`),
  getExpiringDocuments: () => api.get('/hr/documents/expiring'),
};
