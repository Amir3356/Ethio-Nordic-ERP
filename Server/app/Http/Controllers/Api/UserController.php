<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('slug', $request->role);
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = $request->get('per_page', 15);
        $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return $this->successResponse($users);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $tempPassword = strtoupper(bin2hex(random_bytes(4)));

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $tempPassword,
            'is_active' => false,
            'temp_password_expires_at' => now()->addHours(24),
        ]);

        $user->roles()->sync($request->role_ids);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'created',
            'module' => 'user_management',
            'entity_type' => User::class,
            'entity_id' => $user->id,
            'new_values' => $user->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'description' => "Created user {$user->name}",
        ]);

        // TODO: Send activation email with temp password

        return $this->successResponse([
            'user' => $user->load('roles'),
            'temp_password' => $tempPassword,
        ], 'User created successfully.', 201);
    }

    public function show($id): JsonResponse
    {
        $user = User::with(['roles.permissions'])->findOrFail($id);

        return $this->successResponse($user);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$id}",
            'phone' => 'nullable|string|max:20',
            'role_ids' => 'sometimes|array|min:1',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $oldValues = $user->toArray();

        $user->update($request->only(['name', 'email', 'phone']));

        if ($request->has('role_ids')) {
            $user->roles()->sync($request->role_ids);
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'updated',
            'module' => 'user_management',
            'entity_type' => User::class,
            'entity_id' => $user->id,
            'old_values' => $oldValues,
            'new_values' => $user->fresh()->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'description' => "Updated user {$user->name}",
        ]);

        return $this->successResponse($user->fresh()->load('roles'), 'User updated successfully.');
    }

    public function deactivate($id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->hasRole('admin')) {
            $adminCount = User::whereHas('roles', function ($q) {
                $q->where('slug', 'admin');
            })->count();

            if ($adminCount <= 1) {
                return $this->errorResponse('Cannot deactivate the last admin user.', 422);
            }
        }

        $user->update(['is_active' => false]);
        $user->tokens()->delete();

        return $this->successResponse(null, 'User deactivated successfully.');
    }

    public function activate($id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => true]);

        return $this->successResponse(null, 'User activated successfully.');
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'action' => 'required|in:activate,deactivate',
        ]);

        $users = User::whereIn('id', $request->user_ids)->get();
        $action = $request->action;

        foreach ($users as $user) {
            if ($action === 'activate') {
                $user->update(['is_active' => true]);
            } else {
                if ($user->hasRole('admin')) {
                    $adminCount = User::whereHas('roles', function ($q) {
                        $q->where('slug', 'admin');
                    })->count();

                    if ($adminCount <= 1) {
                        continue;
                    }
                }
                $user->update(['is_active' => false]);
                $user->tokens()->delete();
            }
        }

        $affectedCount = User::whereIn('id', $request->user_ids)
            ->where('is_active', $action === 'activate')
            ->count();

        return $this->successResponse([
            'affected_count' => $affectedCount,
        ], "Bulk {$action} completed.");
    }

    public function getUserPermissions($id): JsonResponse
    {
        $user = User::findOrFail($id);
        $permissions = $user->getAllPermissions()->groupBy('module');

        return $this->successResponse([
            'user' => $user->only(['id', 'name', 'email']),
            'permissions' => $permissions,
        ]);
    }
}
