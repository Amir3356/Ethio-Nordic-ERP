<?php

use App\Http\Controllers\Api\HRController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'idle.session'])->group(function () {
    Route::prefix('hr')->group(function () {
        Route::get('/', [HRController::class, 'overview']);

        // Employees
        Route::get('/employees', [HRController::class, 'employees']);
        Route::post('/employees', [HRController::class, 'storeEmployee']);
        Route::get('/employees/{id}', [HRController::class, 'showEmployee']);
        Route::put('/employees/{id}', [HRController::class, 'updateEmployee']);
        Route::post('/employees/{id}/terminate', [HRController::class, 'terminateEmployee']);

        // Attendance
        Route::get('/attendance', [HRController::class, 'attendance']);
        Route::post('/attendance', [HRController::class, 'storeAttendance']);
        Route::get('/attendance/exceptions', [HRController::class, 'attendanceExceptions']);
        Route::post('/attendance/{id}/resolve', [HRController::class, 'resolveException']);

        // Leave Management
        Route::get('/leave-requests', [HRController::class, 'leaveRequests']);
        Route::post('/leave-requests', [HRController::class, 'storeLeaveRequest']);
        Route::post('/leave-requests/{id}/approve', [HRController::class, 'approveLeave']);
        Route::post('/leave-requests/{id}/reject', [HRController::class, 'rejectLeave']);

        // Payroll
        Route::get('/payroll-runs', [HRController::class, 'payrollRuns']);
        Route::post('/payroll-runs', [HRController::class, 'generatePayroll']);
        Route::post('/payroll-runs/{id}/approve', [HRController::class, 'approvePayroll']);
        Route::post('/payroll-runs/{id}/pay', [HRController::class, 'markPayrollPaid']);
        Route::get('/payslips', [HRController::class, 'payslips']);

        // Performance Reviews
        Route::get('/performance-reviews', [HRController::class, 'performanceReviews']);
        Route::post('/performance-reviews', [HRController::class, 'storePerformanceReview']);
        Route::post('/performance-reviews/{id}/self-assessment', [HRController::class, 'submitSelfAssessment']);
        Route::post('/performance-reviews/{id}/manager-review', [HRController::class, 'submitManagerReview']);

        // Training Records
        Route::get('/trainings', [HRController::class, 'trainings']);
        Route::post('/trainings', [HRController::class, 'storeTraining']);
        Route::put('/trainings/{id}', [HRController::class, 'updateTraining']);
        Route::get('/trainings/expiring-certifications', [HRController::class, 'expiringCertifications']);

        // Employee Documents
        Route::get('/documents', [HRController::class, 'employeeDocuments']);
        Route::post('/documents', [HRController::class, 'storeEmployeeDocument']);
        Route::delete('/documents/{id}', [HRController::class, 'deleteEmployeeDocument']);
        Route::get('/documents/{id}/download', [HRController::class, 'downloadDocument']);
        Route::get('/documents/{id}/url', [HRController::class, 'getDocumentUrl']);
        Route::get('/documents/expiring', [HRController::class, 'expiringDocuments']);
    });
});
