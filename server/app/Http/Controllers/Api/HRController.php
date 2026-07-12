<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HR\HRService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HRController extends Controller
{
    public function __construct(
        private readonly HRService $hr
    ) {}

    // ─── Overview ───────────────────────────────────────────────

    public function overview(): JsonResponse
    {
        return $this->hr->overview();
    }

    // ─── Employees ──────────────────────────────────────────────

    public function employees(Request $request): JsonResponse
    {
        return $this->hr->employees($request);
    }

    public function storeEmployee(Request $request): JsonResponse
    {
        return $this->hr->storeEmployee($request);
    }

    public function updateEmployee(Request $request, int $id): JsonResponse
    {
        return $this->hr->updateEmployee($request, $id);
    }

    public function showEmployee(int $id): JsonResponse
    {
        return $this->hr->showEmployee($id);
    }

    public function terminateEmployee(int $id, Request $request): JsonResponse
    {
        return $this->hr->terminateEmployee($id, $request);
    }

    // ─── Attendance ─────────────────────────────────────────────

    public function attendance(Request $request): JsonResponse
    {
        return $this->hr->attendance($request);
    }

    public function storeAttendance(Request $request): JsonResponse
    {
        return $this->hr->storeAttendance($request);
    }

    public function resolveException(int $id, Request $request): JsonResponse
    {
        return $this->hr->resolveException($id, $request);
    }

    public function attendanceExceptions(): JsonResponse
    {
        return $this->hr->attendanceExceptions();
    }

    // ─── Leave Management ───────────────────────────────────────

    public function leaveRequests(Request $request): JsonResponse
    {
        return $this->hr->leaveRequests($request);
    }

    public function storeLeaveRequest(Request $request): JsonResponse
    {
        return $this->hr->storeLeaveRequest($request);
    }

    public function approveLeave(int $id, Request $request): JsonResponse
    {
        return $this->hr->approveLeave($id, $request);
    }

    public function rejectLeave(int $id, Request $request): JsonResponse
    {
        return $this->hr->rejectLeave($id, $request);
    }

    // ─── Payroll ────────────────────────────────────────────────

    public function payrollRuns(Request $request): JsonResponse
    {
        return $this->hr->payrollRuns($request);
    }

    public function generatePayroll(Request $request): JsonResponse
    {
        return $this->hr->generatePayroll($request);
    }

    public function approvePayroll(int $id, Request $request): JsonResponse
    {
        return $this->hr->approvePayroll($id, $request);
    }

    public function markPayrollPaid(int $id): JsonResponse
    {
        return $this->hr->markPayrollPaid($id);
    }

    public function payslips(Request $request): JsonResponse
    {
        return $this->hr->payslips($request);
    }

    // ─── Performance Reviews ────────────────────────────────────

    public function performanceReviews(Request $request): JsonResponse
    {
        return $this->hr->performanceReviews($request);
    }

    public function storePerformanceReview(Request $request): JsonResponse
    {
        return $this->hr->storePerformanceReview($request);
    }

    public function submitSelfAssessment(int $id, Request $request): JsonResponse
    {
        return $this->hr->submitSelfAssessment($id, $request);
    }

    public function submitManagerReview(int $id, Request $request): JsonResponse
    {
        return $this->hr->submitManagerReview($id, $request);
    }

    // ─── Training Records ───────────────────────────────────────

    public function trainings(Request $request): JsonResponse
    {
        return $this->hr->trainings($request);
    }

    public function storeTraining(Request $request): JsonResponse
    {
        return $this->hr->storeTraining($request);
    }

    public function updateTraining(int $id, Request $request): JsonResponse
    {
        return $this->hr->updateTraining($id, $request);
    }

    public function expiringCertifications(): JsonResponse
    {
        return $this->hr->expiringCertifications();
    }

    // ─── Employee Documents ─────────────────────────────────────

    public function employeeDocuments(Request $request): JsonResponse
    {
        return $this->hr->employeeDocuments($request);
    }

    public function storeEmployeeDocument(Request $request): JsonResponse
    {
        return $this->hr->storeEmployeeDocument($request);
    }

    public function deleteEmployeeDocument(int $id): JsonResponse
    {
        return $this->hr->deleteEmployeeDocument($id);
    }

    public function downloadDocument(int $id)
    {
        return $this->hr->downloadDocument($id);
    }

    public function getDocumentUrl(int $id): JsonResponse
    {
        return $this->hr->getDocumentUrl($id);
    }

    public function expiringDocuments(): JsonResponse
    {
        return $this->hr->expiringDocuments();
    }
}
