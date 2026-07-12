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

        return response()->json([
            'success' => true,
            'message' => 'Employee terminated. System access deactivation requested.',
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

    public function storeAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'date' => 'required|date',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i',
            'status' => 'required|string|in:present,late,absent,half_day,on_leave',
            'notes' => 'nullable|string|max:500',
        ]);

        $hoursWorked = 0;
        $overtime = 0;

        if ($validated['check_in'] && $validated['check_out']) {
            $in = \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['check_in']);
            $out = \Carbon\Carbon::parse($validated['date'] . ' ' . $validated['check_out']);
            $diff = $in->diffInHours($out);
            $hoursWorked = max(0, $diff);
            $overtime = max(0, $hoursWorked - 8);
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
            ->where(function ($q) {
                $q->where('status', 'late')
                  ->orWhere('status', 'absent');
            })
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

        $leave = LeaveRequest::create($validated);

        return response()->json(['success' => true, 'data' => $leave], 201);
    }

    public function approveLeave(int $id, Request $request): JsonResponse
    {
        $leave = LeaveRequest::findOrFail($id);

        if ($leave->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Leave request is not pending.'], 422);
        }

        // Calculate current balance from approved leave history
        $year = now()->year;
        $approvedDays = LeaveRequest::where('employee_id', $leave->employee_id)
            ->where('leave_type', $leave->leave_type)
            ->where('status', 'approved')
            ->whereYear('start_date', $year)
            ->sum('days');
        $entitled = 24; // Default annual entitlement, can be customized per leave_type
        $balanceBefore = $entitled - $approvedDays;
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

                // Calculate overtime from attendance
                $monthStart = \Carbon\Carbon::parse($validated['pay_period'] . '-01');
                $monthEnd = $monthStart->copy()->endOfMonth();
                $overtimeHours = AttendanceLog::where('employee_id', $emp->employee_id)
                    ->whereBetween('date', [$monthStart, $monthEnd])
                    ->sum('overtime_hours');
                $hourlyRate = $baseSalary / 208; // 26 days * 8 hours
                $overtimePay = round((float) $overtimeHours * $hourlyRate * 1.5, 2);

                $grossSalary = $baseSalary + $overtimePay;
                $incomeTax = round($grossSalary * 0.15, 2); // 15% income tax
                $pensionEmployee = round($grossSalary * 0.07, 2); // 7% employee pension
                $pensionEmployer = round($grossSalary * 0.11, 2); // 11% employer pension
                $totalDeductionsEmp = $incomeTax + $pensionEmployee;
                $netSalary = $grossSalary - $totalDeductionsEmp;

                Payslip::create([
                    'payroll_run_id' => $run->payroll_run_id,
                    'employee_id' => $emp->employee_id,
                    'base_salary' => $baseSalary,
                    'overtime_pay' => $overtimePay,
                    'allowances' => 0,
                    'bonus' => 0,
                    'gross_salary' => $grossSalary,
                    'income_tax' => $incomeTax,
                    'pension_employee' => $pensionEmployee,
                    'pension_employer' => $pensionEmployer,
                    'other_deductions' => 0,
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

        $selfScore = (float) ($review->self_assessment_score ?? 0);
        $managerScore = (float) $validated['manager_score'];
        $finalScore = round(($selfScore * 0.4) + ($managerScore * 0.6), 2);

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
