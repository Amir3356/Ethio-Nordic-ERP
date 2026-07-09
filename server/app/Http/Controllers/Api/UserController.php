<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\User\UserActivationService;
use App\Services\User\UserBulkActionService;
use App\Services\User\UserPasswordService;
use App\Services\User\UserPermissionService;
use App\Services\User\UserQueryService;
use App\Services\User\UserReportService;
use App\Services\User\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function __construct(
        private readonly UserQueryService $query,
        private readonly UserService $userService,
        private readonly UserActivationService $activation,
        private readonly UserPasswordService $password,
        private readonly UserPermissionService $permission,
        private readonly UserBulkActionService $bulkAction,
        private readonly UserReportService $report,
    ) {}

    /**
     * Display a listing of users with filtering and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        return $this->query->index($request);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'department' => 'required|string|max:255',
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'exists:roles,id',
            'permission_ids' => 'sometimes|array',
            'permission_ids.*' => 'exists:permissions,id',
            'send_email' => 'sometimes|boolean',
        ]);

        return $this->userService->create($request);
    }

    /**
     * Display the specified user.
     */
    public function show($id): JsonResponse
    {
        return $this->query->show($id);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$id}",
            'department' => 'sometimes|string|max:255',
            'role_ids' => 'sometimes|array|min:1',
            'role_ids.*' => 'exists:roles,id',
            'permission_ids' => 'sometimes|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        return $this->userService->update($request, $id);
    }

    /**
     * Remove the specified user (soft delete).
     */
    public function destroy($id): JsonResponse
    {
        return $this->userService->destroy($id);
    }

    /**
     * Activate a user account.
     */
    public function activate($id): JsonResponse
    {
        return $this->activation->activate($id);
    }

    /**
     * Deactivate a user account.
     */
    public function deactivate($id): JsonResponse
    {
        return $this->activation->deactivate($id);
    }

    /**
     * Resend activation email.
     */
    public function resendActivation($id): JsonResponse
    {
        return $this->activation->resendActivation($id);
    }

    /**
     * Reset user password and send email.
     */
    public function resetPassword($id): JsonResponse
    {
        return $this->password->resetPassword($id);
    }

    /**
     * Get user's permissions.
     */
    public function getUserPermissions($id): JsonResponse
    {
        return $this->permission->getUserPermissions($id);
    }

    /**
     * Bulk actions on users.
     */
    public function bulkAction(Request $request): JsonResponse
    {
        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'action' => 'required|in:activate,deactivate,delete',
        ]);

        return $this->bulkAction->bulkAction($request);
    }

    /**
     * Get periodic access review report.
     */
    public function accessReviewReport(Request $request): JsonResponse
    {
        return $this->report->accessReviewReport($request);
    }
}
