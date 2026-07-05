<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\UserActivationMail;
use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Display a listing of users with filtering and pagination
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($request->filled('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('slug', $request->role);
            });
        }

        // Status filter
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Department filter
        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        // Verification status filter
        if ($request->filled('verified')) {
            if ($request->boolean('verified')) {
                $query->verified();
            } else {
                $query->unverified();
            }
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 15);
        $users = $query->paginate($perPage);

        return $this->successResponse($users);
    }

    /**
     * Store a newly created user and send activation email
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'department' => 'required|string|max:255',
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'exists:roles,id',
            'send_email' => 'sometimes|boolean',
        ]);

        DB::beginTransaction();
        try {
            // Generate temporary password
            $tempPassword = Str::random(12);

            $user = User::create([
                'full_name' => $request->full_name,
                'email' => $request->email,
                'department' => $request->department,
                'password' => Hash::make($tempPassword),
                'is_active' => true,
                'temp_password_expires_at' => now()->addDays(7),
            ]);

            // Assign roles
            $user->roles()->sync($request->role_ids);

            // Send activation email if requested (default: true)
            if ($request->get('send_email', true)) {
                try {
                    $activationUrl = config('app.frontend_url') . '/activate-account?token=' . base64_encode($user->email);
                    
                    Mail::to($user->email)->send(
                        new UserActivationMail($user, $tempPassword, $activationUrl)
                    );
                    
                    $emailSent = true;
                } catch (\Exception $e) {
                    \Log::error('Failed to send activation email: ' . $e->getMessage());
                    $emailSent = false;
                }
            } else {
                $emailSent = false;
            }

            DB::commit();

            return $this->successResponse([
                'user' => $user->load('roles'),
                'temp_password' => $tempPassword,
                'email_sent' => $emailSent,
            ], 'User created successfully.', 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to create user: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified user
     */
    public function show($id): JsonResponse
    {
        $user = User::with(['roles.permissions', 'loginActivities' => function($query) {
            $query->latest()->limit(10);
        }])->findOrFail($id);

        return $this->successResponse([
            'user' => $user,
            'has_2fa_enabled' => $user->hasTwoFactorEnabled(),
            'last_login' => $user->last_login_at?->diffForHumans(),
        ]);
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$id}",
            'department' => 'sometimes|string|max:255',
            'role_ids' => 'sometimes|array|min:1',
            'role_ids.*' => 'exists:roles,id',
        ]);

        DB::beginTransaction();
        try {
            $user->update($request->only(['full_name', 'email', 'department']));

            if ($request->has('role_ids')) {
                $user->roles()->sync($request->role_ids);
            }

            DB::commit();

            return $this->successResponse($user->fresh()->load('roles'), 'User updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to update user: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove the specified user (soft delete)
     */
    public function destroy($id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Prevent deleting the last admin
        if ($user->isAdmin()) {
            $adminCount = User::whereHas('roles', function ($q) {
                $q->where('slug', 'admin')->orWhere('slug', 'super-admin');
            })->count();

            if ($adminCount <= 1) {
                return $this->errorResponse('Cannot delete the last admin user.', 422);
            }
        }

        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return $this->errorResponse('You cannot delete your own account.', 422);
        }

        // Soft delete and revoke all tokens
        $user->tokens()->delete();
        $user->delete();

        return $this->successResponse(null, 'User deleted successfully.');
    }

    /**
     * Activate a user account
     */
    public function activate($id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->activate();

        return $this->successResponse($user, 'User activated successfully.');
    }

    /**
     * Deactivate a user account
     */
    public function deactivate($id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Prevent deactivating the last admin
        if ($user->isAdmin()) {
            $adminCount = User::active()->whereHas('roles', function ($q) {
                $q->where('slug', 'admin')->orWhere('slug', 'super-admin');
            })->count();

            if ($adminCount <= 1) {
                return $this->errorResponse('Cannot deactivate the last admin user.', 422);
            }
        }

        // Prevent self-deactivation
        if ($user->id === auth()->id()) {
            return $this->errorResponse('You cannot deactivate your own account.', 422);
        }

        $user->deactivate();

        return $this->successResponse($user, 'User deactivated successfully.');
    }

    /**
     * Resend activation email
     */
    public function resendActivation($id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->email_verified_at) {
            return $this->errorResponse('User email is already verified.', 422);
        }

        try {
            // Generate new temporary password
            $tempPassword = $user->generateTemporaryPassword();
            
            $activationUrl = config('app.frontend_url') . '/activate-account?token=' . base64_encode($user->email);
            
            Mail::to($user->email)->send(
                new UserActivationMail($user, $tempPassword, $activationUrl)
            );

            return $this->successResponse([
                'temp_password' => $tempPassword,
            ], 'Activation email sent successfully.');

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to send activation email: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Reset user password and send email
     */
    public function resetPassword(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        try {
            // Generate new temporary password
            $tempPassword = $user->generateTemporaryPassword();
            
            $resetUrl = config('app.frontend_url') . '/reset-password?token=' . base64_encode($user->email);
            
            Mail::to($user->email)->send(
                new PasswordResetMail($user, $resetUrl, $tempPassword)
            );

            return $this->successResponse([
                'temp_password' => $tempPassword,
            ], 'Password reset email sent successfully.');

        } catch (\Exception $e) {
            return $this->errorResponse('Failed to send password reset email: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Bulk actions on users
     */
    public function bulkAction(Request $request): JsonResponse
    {
        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'action' => 'required|in:activate,deactivate,delete',
        ]);

        // Prevent actions on self
        if (in_array(auth()->id(), $request->user_ids)) {
            return $this->errorResponse('You cannot perform bulk actions on your own account.', 422);
        }

        $users = User::whereIn('id', $request->user_ids)->get();
        $action = $request->action;
        $successCount = 0;
        $failedCount = 0;

        foreach ($users as $user) {
            try {
                switch ($action) {
                    case 'activate':
                        $user->activate();
                        $successCount++;
                        break;

                    case 'deactivate':
                        // Skip if last admin
                        if ($user->isAdmin()) {
                            $adminCount = User::active()->whereHas('roles', function ($q) {
                                $q->where('slug', 'admin')->orWhere('slug', 'super-admin');
                            })->count();

                            if ($adminCount <= 1) {
                                $failedCount++;
                                continue 2;
                            }
                        }
                        $user->deactivate();
                        $successCount++;
                        break;

                    case 'delete':
                        // Skip if last admin
                        if ($user->isAdmin()) {
                            $adminCount = User::whereHas('roles', function ($q) {
                                $q->where('slug', 'admin')->orWhere('slug', 'super-admin');
                            })->count();

                            if ($adminCount <= 1) {
                                $failedCount++;
                                continue 2;
                            }
                        }
                        $user->tokens()->delete();
                        $user->delete();
                        $successCount++;
                        break;
                }
            } catch (\Exception $e) {
                $failedCount++;
            }
        }

        return $this->successResponse([
            'success_count' => $successCount,
            'failed_count' => $failedCount,
        ], "Bulk {$action} completed. {$successCount} successful, {$failedCount} failed.");
    }

    /**
     * Get user's permissions
     */
    public function getUserPermissions($id): JsonResponse
    {
        $user = User::findOrFail($id);
        $permissions = $user->permissions()->get()->groupBy('module');

        return $this->successResponse([
            'user' => $user->only(['id', 'full_name', 'email']),
            'roles' => $user->roles,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Get periodic access review report
     */
    public function accessReviewReport(Request $request): JsonResponse
    {
        $inactiveDays = $request->get('inactive_days', 90);

        $users = User::with(['roles'])
            ->where(function($query) use ($inactiveDays) {
                $query->whereNull('last_login_at')
                    ->orWhere('last_login_at', '<', now()->subDays($inactiveDays));
            })
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'department' => $user->department,
                    'roles' => $user->roles->pluck('name'),
                    'last_login' => $user->last_login_at?->format('Y-m-d H:i:s'),
                    'days_since_login' => $user->last_login_at ? $user->last_login_at->diffInDays(now()) : null,
                    'is_active' => $user->is_active,
                ];
            });

        return $this->successResponse([
            'inactive_days_threshold' => $inactiveDays,
            'total_inactive_users' => $users->count(),
            'users' => $users,
        ]);
    }
}
