<?php

namespace App\Services\HR;

use App\Models\Employee;
use App\Models\AttendanceLog;
use App\Models\LeaveRequest;
use App\Models\PayrollRun;
use App\Models\Payslip;
use App\Models\PerformanceReview;
use App\Models\Training;
use App\Models\EmployeeDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class HRService
{
    // ─── Overview ───────────────────────────────────────────────

    public function overview(): JsonResponse
    {
        $employees = Employee::all();
        $departments = $employees->pluck('department')->unique()->values();
        $activeCount = $employees->where('employment_status', 'active')->count();
        $totalPayroll = Payslip::where('status', 'paid')->sum('net_salary');
        $pendingLeaves = LeaveRequest::where('status', 'pending')->count();
        $upcomingTrainings = Training::where('status', 'scheduled')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'employees' => $employees,
                'departments' => $departments,
                'total_headcount' => $activeCount,
                'total_payroll' => $totalPayroll,
                'pending_leaves' => $pendingLeaves,
                'upcoming_trainings' => $upcomingTrainings,
            ],
        ]);
    }

    // ─── Employees ──────────────────────────────────────────────

    public function employees(Request $request): JsonResponse
    {
        $query = Employee::with(['manager']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        if ($request->filled('status')) {
            $query->where('employment_status', $request->status);
        }

        $employees = $query->orderBy('first_name')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $employees]);
    }

    public function storeEmployee(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'nullable|string|max:50',
            'department' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'manager_id' => 'nullable|integer|exists:employees,employee_id',
            'hire_date' => 'required|date',
            'contract_type' => 'required|string|in:permanent,contract,temporary',
            'employment_status' => 'sometimes|string|in:active,on_leave,terminated',
            'salary_grade' => 'nullable|string|max:50',
            'base_salary_etb' => 'required|numeric|min:0',
            'currency' => 'sometimes|string|max:10',
            'location' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'marital_status' => 'nullable|string|max:20',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        $validated['employee_code'] = $this->generateEmployeeCode();
        $validated['employment_status'] = $validated['employment_status'] ?? 'active';
        $validated['currency'] = $validated['currency'] ?? 'ETB';

        $employee = Employee::create($validated);

        // Step 1: onboarding triggers a provisioning request to User & Access Management.
        \App\Events\EmployeeOnboarded::dispatch(
            $employee->employee_id,
            $employee->first_name . ' ' . $employee->last_name,
            $employee->email,
            $employee->department,
        );

        return response()->json(['success' => true, 'data' => $employee], 201);
    }

    public function updateEmployee(Request $request, int $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:employees,email,' . $id . ',employee_id',
            'phone' => 'nullable|string|max:50',
            'department' => 'sometimes|string|max:255',
            'position' => 'sometimes|string|max:255',
            'manager_id' => 'nullable|integer|exists:employees,employee_id',
            'contract_type' => 'sometimes|string|in:permanent,contract,temporary',
            'employment_status' => 'sometimes|string|in:active,on_leave,terminated',
            'salary_grade' => 'nullable|string|max:50',
            'base_salary_etb' => 'sometimes|numeric|min:0',
            'location' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'marital_status' => 'nullable|string|max:20',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        $employee->update($validated);

        return response()->json(['success' => true, 'data' => $employee->fresh()]);
    }

    public function showEmployee(int $id): JsonResponse
    {
        $employee = Employee::with(['manager', 'documents', 'trainings', 'performanceReviews', 'leaveRequests'])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $employee]);
    }

    public function terminateEmployee(int $id, Request $request): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $employee->update(['employment_status' => 'terminated']);

        // Step 9: Final Settlement = pro-rated unpaid salary + accrued unused
        // leave payout − outstanding deductions.
        $baseSalary = (float) $employee->base_salary_etb;
        $dailyRate = $baseSalary / self::WORKING_DAYS_PER_MONTH;
        $daysWorkedThisMonth = AttendanceLog::where('employee_id', $employee->employee_id)
            ->whereBetween('date', [now()->startOfMonth(), now()])
            ->whereIn('status', ['present', 'late', 'early_departure', 'half_day'])
            ->count();
        $proRatedSalary = round($dailyRate * $daysWorkedThisMonth, 2);
        $remainingLeave = max(0, $this->accruedLeaveBalance($employee->employee_id, 'annual'));
        $leavePayout = round($dailyRate * $remainingLeave, 2);
        $finalSettlement = [
            'pro_rated_salary' => $proRatedSalary,
            'days_worked_this_month' => $daysWorkedThisMonth,
            'accrued_unused_leave_days' => $remainingLeave,
            'leave_payout' => $leavePayout,
            'outstanding_deductions' => 0,
            'total_settlement' => round($proRatedSalary + $leavePayout, 2),
        ];

        // Automatic deactivation request to User & Access Management.
        \App\Events\EmployeeTerminated::dispatch(
            $employee->employee_id,
            $employee->email,
            $validated['reason'] ?? null,
        );

        return response()->json([
            'success' => true,
            'message' => 'Employee terminated. Final settlement calculated and system access deactivation requested.',
            'final_settlement' => $finalSettlement,
            'data' => $employee->fresh(),
        ]);
    }

    private function generateEmployeeCode(): string
    {
        $last = Employee::orderByDesc('employee_id')->value('employee_code');
        if ($last && preg_match('/EN-(\d+)/', $last, $m)) {
            return 'EN-' . str_pad((int) $m[1] + 1, 4, '0', STR_PAD_LEFT);
        }
        return 'EN-1001';
    }

    // ─── Attendance ─────────────────────────────────────────────

    public function attendance(Request $request): JsonResponse
    {
        $query = AttendanceLog::with(['employee']);

        if ($request->filled('date')) {
            $query->where('date', $request->date);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $logs = $query->orderByDesc('date')->paginate($request->get('per_page', 50));

        return response()->json(['success' => true, 'data' => $logs]);
    }

    /** Standard work schedule used for exception detection (Step 2). */
    private const SCHEDULED_START = '08:30';
    private const SCHEDULED_END = '17:30';
    private const GRACE_MINUTES = 15;

    public function storeAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'date' => 'required|date',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i',
            'break_minutes' => 'sometimes|integer|min:0|max:480',
            'status' => 'sometimes|string|in:present,late,early_departure,absent,half_day,on_leave',
            'notes' => 'nullable|string|max:500',
        ]);

        $hoursWorked = 0;
        $overtime = 0;
        $breakMinutes = (int) ($validated['break_minutes'] ?? 60); // default 1h unpaid break
        unset($validated['break_minutes']);

        // Worked Hours = Time Out − Time In − Unpaid Break Duration
        if (!empty($validated['check_in']) && !empty($validated['check_out'])) {
            $in = \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['check_in']);
            $out = \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['check_out']);
            $hoursWorked = round(max(0, $in->diffInMinutes($out) - $breakMinutes) / 60, 2);
            $overtime = round(max(0, $hoursWorked - 8), 2);
        }

        // Exception flags are derived automatically unless a status is supplied:
        //   time in > scheduled start + grace  -> late arrival
        //   time out < scheduled end           -> early departure
        //   no clock-in recorded               -> unexcused absence
        if (empty($validated['status'])) {
            if (empty($validated['check_in'])) {
                $validated['status'] = 'absent';
                $validated['exception_reason'] = 'Unexcused absence: no clock-in recorded';
            } else {
                $lateCutoff = \Carbon\Carbon::parse($validated['date'] . ' ' . self::SCHEDULED_START)
                    ->addMinutes(self::GRACE_MINUTES);
                $scheduledEnd = \Carbon\Carbon::parse($validated['date'] . ' ' . self::SCHEDULED_END);
                $in = \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['check_in']);
                $out = !empty($validated['check_out'])
                    ? \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['check_out'])
                    : null;

                if ($in->gt($lateCutoff)) {
                    $validated['status'] = 'late';
                    $validated['exception_reason'] = 'Late arrival: clocked in at ' . $in->format('H:i');
                } elseif ($out && $out->lt($scheduledEnd)) {
                    $validated['status'] = 'early_departure';
                    $validated['exception_reason'] = 'Early departure: clocked out at ' . $out->format('H:i');
                } else {
                    $validated['status'] = 'present';
                }
            }
        }

        $validated['hours_worked'] = $hoursWorked;
        $validated['overtime_hours'] = $overtime;
        $validated['exception_resolved'] = false;

        $log = AttendanceLog::updateOrCreate(
            ['employee_id' => $validated['employee_id'], 'date' => $validated['date']],
            $validated
        );

        return response()->json(['success' => true, 'data' => $log], 201);
    }

    public function resolveException(int $id, Request $request): JsonResponse
    {
        $log = AttendanceLog::findOrFail($id);

        $validated = $request->validate([
            'exception_reason' => 'required|string|max:500',
        ]);

        $log->update([
            'exception_reason' => $validated['exception_reason'],
            'exception_resolved' => true,
        ]);

        return response()->json(['success' => true, 'data' => $log->fresh()]);
    }

    public function attendanceExceptions(): JsonResponse
    {
        $exceptions = AttendanceLog::with(['employee'])
            ->where('exception_resolved', false)
            ->whereIn('status', ['late', 'early_departure', 'absent'])
            ->orderByDesc('date')
            ->get();

        return response()->json(['success' => true, 'data' => $exceptions]);
    }

    // ─── Leave Management ───────────────────────────────────────

    public function leaveRequests(Request $request): JsonResponse
    {
        $query = LeaveRequest::with(['employee', 'approver']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('leave_type')) {
            $query->where('leave_type', $request->leave_type);
        }

        $requests = $query->orderByDesc('created_at')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $requests]);
    }

    public function storeLeaveRequest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'leave_type' => 'required|string|in:annual,sick,maternity,bereavement,unpaid',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:500',
        ]);

        $start = \Carbon\Carbon::parse($validated['start_date']);
        $end = \Carbon\Carbon::parse($validated['end_date']);
        $validated['days'] = $start->diffInDays($end) + 1;
        $validated['status'] = 'pending';

        // Step 3: real-time check — Requested Days ≤ Accrued Balance − Pending Requests,
        // where Accrued Balance(t) = Monthly Accrual × months elapsed − Days Taken.
        if (array_key_exists($validated['leave_type'], self::LEAVE_ENTITLEMENTS)) {
            $accrued = $this->accruedLeaveBalance($validated['employee_id'], $validated['leave_type']);
            $pending = (float) LeaveRequest::where('employee_id', $validated['employee_id'])
                ->where('leave_type', $validated['leave_type'])
                ->where('status', 'pending')
                ->whereYear('start_date', $start->year)
                ->sum('days');
            $available = $accrued - $pending;
            if ($validated['days'] > $available) {
                return response()->json([
                    'success' => false,
                    'message' => "Insufficient {$validated['leave_type']} leave balance: {$available} day(s) available (accrued {$accrued} minus pending {$pending}), {$validated['days']} requested.",
                ], 422);
            }
        }

        $leave = LeaveRequest::create($validated);

        return response()->json(['success' => true, 'data' => $leave], 201);
    }

    /** Annual entitlements per leave type (days). Monthly accrual = entitlement ÷ 12. */
    private const LEAVE_ENTITLEMENTS = ['annual' => 24, 'sick' => 12, 'maternity' => 120, 'bereavement' => 5];

    /** Accrued Balance(t) = (Annual Entitlement ÷ 12) × months elapsed − Days Taken. */
    private function accruedLeaveBalance(int $employeeId, string $leaveType): float
    {
        $entitlement = self::LEAVE_ENTITLEMENTS[$leaveType] ?? 0;
        $monthsElapsed = min(12, now()->month);
        $accruedToDate = round($entitlement / 12 * $monthsElapsed, 1);

        $taken = (float) LeaveRequest::where('employee_id', $employeeId)
            ->where('leave_type', $leaveType)
            ->where('status', 'approved')
            ->whereYear('start_date', now()->year)
            ->sum('days');

        return round($accruedToDate - $taken, 1);
    }

    public function approveLeave(int $id, Request $request): JsonResponse
    {
        $leave = LeaveRequest::findOrFail($id);

        if ($leave->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Leave request is not pending.'], 422);
        }

        // Balance updates only on final approval (Step 3).
        $balanceBefore = $this->accruedLeaveBalance($leave->employee_id, $leave->leave_type);
        $balanceAfter = $balanceBefore - $leave->days;

        $leave->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->employee_id,
            'approved_date' => now(),
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
        ]);

        return response()->json(['success' => true, 'data' => $leave->fresh()]);
    }

    public function rejectLeave(int $id, Request $request): JsonResponse
    {
        $leave = LeaveRequest::findOrFail($id);

        if ($leave->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Leave request is not pending.'], 422);
        }

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $leave->update([
            'status' => 'rejected',
            'approved_by' => $request->user()?->employee_id,
            'approved_date' => now(),
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        return response()->json(['success' => true, 'data' => $leave->fresh()]);
    }

    // ─── Payroll ────────────────────────────────────────────────

    private const OVERTIME_MULTIPLIER = 1.5;
    private const WORKING_DAYS_PER_MONTH = 22;

    /**
     * Ethiopian monthly PAYE brackets (Ministry of Revenue tables):
     * Tax = Taxable Income × Bracket Rate − Deduction Constant.
     * Update these at each fiscal change.
     */
    private const TAX_BRACKETS = [
        // [upper bound, rate, deduction constant]
        [600, 0.00, 0],
        [1650, 0.10, 60],
        [3200, 0.15, 142.50],
        [5250, 0.20, 302.50],
        [7800, 0.25, 565],
        [10900, 0.30, 955],
        [PHP_FLOAT_MAX, 0.35, 1500],
    ];

    private function progressiveIncomeTax(float $taxableIncome): float
    {
        foreach (self::TAX_BRACKETS as [$upper, $rate, $constant]) {
            if ($taxableIncome <= $upper) {
                return round(max(0, $taxableIncome * $rate - $constant), 2);
            }
        }
        return 0;
    }

    public function payrollRuns(Request $request): JsonResponse
    {
        $query = PayrollRun::with(['payslips.employee', 'preparer', 'approver']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $runs = $query->orderByDesc('created_at')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $runs]);
    }

    public function generatePayroll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pay_period' => 'required|string|unique:payroll_runs,pay_period',
            'pay_date' => 'required|date',
        ]);

        $activeEmployees = Employee::where('employment_status', 'active')->get();

        if ($activeEmployees->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'No active employees found.'], 422);
        }

        return DB::transaction(function () use ($validated, $activeEmployees) {
            $run = PayrollRun::create([
                'pay_period' => $validated['pay_period'],
                'pay_date' => $validated['pay_date'],
                'status' => 'draft',
                'prepared_by' => request()->user()?->employee_id,
            ]);

            $totalGross = 0;
            $totalDeductions = 0;
            $totalNet = 0;

            foreach ($activeEmployees as $emp) {
                $baseSalary = (float) $emp->base_salary_etb;

                $monthStart = \Carbon\Carbon::parse($validated['pay_period'] . '-01');
                $monthEnd = $monthStart->copy()->endOfMonth();

                // Overtime Pay = OT Hours × (Hourly Rate × 1.5), Hourly Rate = Base ÷ 208
                $overtimeHours = AttendanceLog::where('employee_id', $emp->employee_id)
                    ->whereBetween('date', [$monthStart, $monthEnd])
                    ->sum('overtime_hours');
                $hourlyRate = $baseSalary / 208; // 26 days * 8 hours
                $overtimePay = round((float) $overtimeHours * $hourlyRate * self::OVERTIME_MULTIPLIER, 2);

                // Absence Deduction = (Base ÷ Working Days) × Unexcused Absence Days
                $absenceDays = AttendanceLog::where('employee_id', $emp->employee_id)
                    ->whereBetween('date', [$monthStart, $monthEnd])
                    ->where('status', 'absent')
                    ->where('exception_resolved', false)
                    ->count();
                $absenceDeduction = round($baseSalary / self::WORKING_DAYS_PER_MONTH * $absenceDays, 2);

                // Gross = Base + Allowances + Overtime − Absence Deduction
                $allowances = 0.0; // per-employee allowances configurable in a future iteration
                $grossSalary = round($baseSalary + $allowances + $overtimePay - $absenceDeduction, 2);

                // Statutory deductions: pension on basic salary (7% / 11%).
                $pensionEmployee = round($baseSalary * 0.07, 2);
                $pensionEmployer = round($baseSalary * 0.11, 2);

                // Income Tax: progressive brackets on Taxable Income = Gross − Pension(Employee).
                $taxableIncome = max(0, $grossSalary - $pensionEmployee);
                $incomeTax = $this->progressiveIncomeTax($taxableIncome);

                $totalDeductionsEmp = $incomeTax + $pensionEmployee;
                $netSalary = round($grossSalary - $totalDeductionsEmp, 2);

                Payslip::create([
                    'payroll_run_id' => $run->payroll_run_id,
                    'employee_id' => $emp->employee_id,
                    'base_salary' => $baseSalary,
                    'overtime_pay' => $overtimePay,
                    'allowances' => $allowances,
                    'bonus' => 0,
                    'gross_salary' => $grossSalary,
                    'income_tax' => $incomeTax,
                    'pension_employee' => $pensionEmployee,
                    'pension_employer' => $pensionEmployer,
                    'other_deductions' => $absenceDeduction,
                    'net_salary' => $netSalary,
                    'status' => 'draft',
                ]);

                $totalGross += $grossSalary;
                $totalDeductions += $totalDeductionsEmp;
                $totalNet += $netSalary;
            }

            $run->update([
                'total_gross' => $totalGross,
                'total_deductions' => $totalDeductions,
                'total_net' => $totalNet,
                'employee_count' => $activeEmployees->count(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payroll draft generated.',
                'data' => $run->fresh(['payslips.employee']),
            ], 201);
        });
    }

    public function approvePayroll(int $id, Request $request): JsonResponse
    {
        $run = PayrollRun::findOrFail($id);

        if ($run->status !== 'draft') {
            return response()->json(['success' => false, 'message' => 'Payroll run is not in draft status.'], 422);
        }

        $run->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->employee_id,
            'approved_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $run->fresh()]);
    }

    public function markPayrollPaid(int $id): JsonResponse
    {
        $run = PayrollRun::findOrFail($id);

        if ($run->status !== 'approved') {
            return response()->json(['success' => false, 'message' => 'Payroll run is not approved.'], 422);
        }

        $run->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $run->payslips()->update(['status' => 'paid']);

        // Module 4, Step 5: post the consolidated payroll journal to Finance.
        $payslips = $run->payslips()->get();
        \App\Events\PayrollDisbursed::dispatch(
            $run->payroll_run_id,
            $run->pay_period,
            (float) $payslips->sum('gross_salary'),
            (float) $payslips->sum('income_tax'),
            (float) $payslips->sum('pension_employee'),
            (float) $payslips->sum('net_salary'),
        );

        return response()->json(['success' => true, 'data' => $run->fresh()]);
    }

    public function payslips(Request $request): JsonResponse
    {
        $query = Payslip::with(['employee', 'payrollRun']);

        if ($request->filled('payroll_run_id')) {
            $query->where('payroll_run_id', $request->payroll_run_id);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        $payslips = $query->orderByDesc('created_at')->paginate($request->get('per_page', 50));

        return response()->json(['success' => true, 'data' => $payslips]);
    }

    // ─── Performance Reviews ────────────────────────────────────

    /** Assessment weights — configurable per company policy (Step 6). */
    private const WEIGHT_SELF = 0.30;
    private const WEIGHT_MANAGER = 0.70;

    public function performanceReviews(Request $request): JsonResponse
    {
        $query = PerformanceReview::with(['employee', 'reviewer']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('review_period')) {
            $query->where('review_period', $request->review_period);
        }

        $reviews = $query->orderByDesc('created_at')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $reviews]);
    }

    public function storePerformanceReview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'review_period' => 'required|string|max:50',
            'reviewer_id' => 'nullable|exists:employees,employee_id',
        ]);

        $validated['status'] = 'draft';

        $review = PerformanceReview::create($validated);

        return response()->json(['success' => true, 'data' => $review], 201);
    }

    public function submitSelfAssessment(int $id, Request $request): JsonResponse
    {
        $review = PerformanceReview::findOrFail($id);

        $validated = $request->validate([
            'self_assessment_score' => 'required|numeric|min:0|max:100',
            'strengths' => 'nullable|string|max:1000',
            'improvements' => 'nullable|string|max:1000',
            'goals' => 'nullable|string|max:1000',
        ]);

        $review->update($validated + ['status' => 'self_assessment_done']);

        return response()->json(['success' => true, 'data' => $review->fresh()]);
    }

    public function submitManagerReview(int $id, Request $request): JsonResponse
    {
        $review = PerformanceReview::findOrFail($id);

        $validated = $request->validate([
            'manager_score' => 'required|numeric|min:0|max:100',
            'rating' => 'required|string|in:exceeds_expectations,meets_expectations,needs_improvement,unsatisfactory',
        ]);

        // Consolidated Score = Self × Weight_self + Manager × Weight_manager (Step 6).
        $selfScore = (float) ($review->self_assessment_score ?? 0);
        $managerScore = (float) $validated['manager_score'];
        $finalScore = round(($selfScore * self::WEIGHT_SELF) + ($managerScore * self::WEIGHT_MANAGER), 2);

        $review->update($validated + [
            'final_score' => $finalScore,
            'review_date' => now()->toDateString(),
            'status' => 'completed',
        ]);

        return response()->json(['success' => true, 'data' => $review->fresh()]);
    }

    // ─── Training Records ───────────────────────────────────────

    public function trainings(Request $request): JsonResponse
    {
        $query = Training::with(['employee']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        $trainings = $query->orderByDesc('training_date')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $trainings]);
    }

    public function storeTraining(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'training_name' => 'required|string|max:255',
            'provider' => 'nullable|string|max:255',
            'training_date' => 'required|date',
            'duration_days' => 'sometimes|integer|min:0',
            'certification' => 'nullable|string|max:255',
            'cert_expiry' => 'nullable|date',
            'status' => 'sometimes|string|in:completed,scheduled,cancelled',
            'cost_etb' => 'sometimes|numeric|min:0',
        ]);

        $validated['status'] = $validated['status'] ?? 'completed';

        $training = Training::create($validated);

        return response()->json(['success' => true, 'data' => $training], 201);
    }

    public function updateTraining(int $id, Request $request): JsonResponse
    {
        $training = Training::findOrFail($id);

        $validated = $request->validate([
            'training_name' => 'sometimes|string|max:255',
            'provider' => 'nullable|string|max:255',
            'training_date' => 'sometimes|date',
            'duration_days' => 'sometimes|integer|min:0',
            'certification' => 'nullable|string|max:255',
            'cert_expiry' => 'nullable|date',
            'status' => 'sometimes|string|in:completed,scheduled,cancelled',
            'cost_etb' => 'sometimes|numeric|min:0',
        ]);

        $training->update($validated);

        return response()->json(['success' => true, 'data' => $training->fresh()]);
    }

    public function expiringCertifications(): JsonResponse
    {
        $threshold = now()->addDays(90);

        $trainings = Training::with(['employee'])
            ->whereNotNull('cert_expiry')
            ->where('cert_expiry', '<=', $threshold)
            ->where('cert_expiry', '>=', now())
            ->where('status', '!=', 'cancelled')
            ->orderBy('cert_expiry')
            ->get();

        return response()->json(['success' => true, 'data' => $trainings]);
    }

    // ─── Employee Documents ─────────────────────────────────────

    public function employeeDocuments(Request $request): JsonResponse
    {
        $query = EmployeeDocument::with(['employee']);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('document_type')) {
            $query->where('document_type', $request->document_type);
        }

        $documents = $query->orderByDesc('upload_date')->paginate($request->get('per_page', 25));

        return response()->json(['success' => true, 'data' => $documents]);
    }

    public function storeEmployeeDocument(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'document_type' => 'required|string|in:employment_contract,id_copy,certification,license,other',
            'document_name' => 'required|string|max:255',
            'file' => 'required|file|max:10240', // 10MB max
            'upload_date' => 'required|date',
            'expiry_date' => 'nullable|date',
            'access_level' => 'sometimes|string|in:hr_manager,admin,management',
        ]);

        // Upload file to S3-compatible storage (MinIO)
        $file = $request->file('file');
        $employeeId = $validated['employee_id'];
        $docType = $validated['document_type'];
        $timestamp = now()->timestamp;
        $filename = $timestamp . '_' . $file->getClientOriginalName();
        $path = "hr-documents/{$employeeId}/{$docType}/{$filename}";

        Storage::disk('s3')->put($path, file_get_contents($file), 'private');

        $validated['file_path'] = $path;
        $validated['document_name'] = $file->getClientOriginalName();
        $validated['file_size_kb'] = round($file->getSize() / 1024);
        $validated['status'] = 'active';
        $validated['access_level'] = $validated['access_level'] ?? 'hr_manager';

        if (!empty($validated['expiry_date']) && \Carbon\Carbon::parse($validated['expiry_date'])->isPast()) {
            $validated['status'] = 'expired';
        } elseif (!empty($validated['expiry_date']) && \Carbon\Carbon::parse($validated['expiry_date'])->diffInDays(now()) <= 90) {
            $validated['status'] = 'expiring_soon';
        }

        $document = EmployeeDocument::create($validated);

        return response()->json(['success' => true, 'data' => $document], 201);
    }

    public function downloadDocument(int $id): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $document = EmployeeDocument::findOrFail($id);

        if (!Storage::disk('s3')->exists($document->file_path)) {
            abort(404, 'File not found in storage.');
        }

        return Storage::disk('s3')->download($document->file_path, $document->document_name);
    }

    public function getDocumentUrl(int $id): JsonResponse
    {
        $document = EmployeeDocument::findOrFail($id);

        if (!Storage::disk('s3')->exists($document->file_path)) {
            return response()->json(['success' => false, 'message' => 'File not found.'], 404);
        }

        // Generate a temporary signed URL (valid for 1 hour)
        $url = Storage::disk('s3')->temporaryUrl($document->file_path, now()->addHour());

        return response()->json(['success' => true, 'data' => ['url' => $url]]);
    }

    public function deleteEmployeeDocument(int $id): JsonResponse
    {
        $document = EmployeeDocument::findOrFail($id);

        // Delete file from S3
        if ($document->file_path && Storage::disk('s3')->exists($document->file_path)) {
            Storage::disk('s3')->delete($document->file_path);
        }

        $document->delete();

        return response()->json(['success' => true, 'message' => 'Document deleted.']);
    }

    public function expiringDocuments(): JsonResponse
    {
        $threshold = now()->addDays(90);

        $documents = EmployeeDocument::with(['employee'])
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', $threshold)
            ->orderBy('expiry_date')
            ->get();

        return response()->json(['success' => true, 'data' => $documents]);
    }
}
