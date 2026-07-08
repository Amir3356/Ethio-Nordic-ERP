export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  manager_id: string | null;
  hire_date: string;
  contract_type: string;
  employment_status: string;
  salary_grade: string;
  base_salary_etb: number;
  currency: string;
  location: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  emergency_contact: string;
  emergency_phone: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  hours_worked: number;
  status: string;
  overtime_hours: number;
  notes: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: string;
  approved_by: string | null;
  approved_date: string | null;
  balance_before: number;
  balance_after: number;
}

export interface LeaveBalance {
  employee_id: string;
  annual_entitled: number;
  annual_taken: number;
  annual_remaining: number;
  sick_entitled: number;
  sick_taken: number;
  sick_remaining: number;
  maternity_entitled: number;
  maternity_taken: number;
  maternity_remaining: number;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  pay_period: string;
  base_salary: number;
  overtime_pay: number;
  allowances: number;
  bonus: number;
  gross_salary: number;
  income_tax: number;
  pension_employee: number;
  pension_employer: number;
  other_deductions: number;
  net_salary: number;
  status: string;
  payment_date: string | null;
  payslip_generated: boolean;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  review_period: string;
  self_assessment_score: number;
  manager_score: number;
  final_score: number;
  rating: string;
  strengths: string;
  improvements: string;
  goals: string;
  reviewer_id: string;
  review_date: string;
  status: string;
}

export interface TrainingRecord {
  id: string;
  employee_id: string;
  training_name: string;
  provider: string;
  training_date: string;
  duration_days: number;
  certification: string | null;
  cert_expiry: string | null;
  status: string;
  cost_etb: number;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: string;
  document_name: string;
  upload_date: string;
  expiry_date: string | null;
  status: string;
  access_level: string;
  file_size_kb: number;
}

export interface Department {
  id: string;
  name: string;
  head_id: string;
  employee_count: number;
  budget_etb: number;
}

export interface HRData {
  employees: Employee[];
  attendance: Attendance[];
  leave_requests: LeaveRequest[];
  leave_balances: LeaveBalance[];
  payroll: PayrollRecord[];
  performance_reviews: PerformanceReview[];
  training_records: TrainingRecord[];
  employee_documents: EmployeeDocument[];
  departments: Department[];
}
