<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
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
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'department' => 'required|string|max:255',
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $tempPassword = strtoupper(bin2hex(random_bytes(4)));

        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'department' => $request->department,
            'password' => $tempPassword,
            'is_active' => true,
            'temp_password_expires_at' => now()->addHours(24),
        ]);

        $user->roles()->sync($request->role_ids);

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
            'full_name' => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$id}",
            'department' => 'sometimes|string|max:255',
            'role_ids' => 'sometimes|array|min:1',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $user->update($request->only(['full_name', 'email', 'department']));

        if ($request->has('role_ids')) {
            $user->roles()->sync($request->role_ids);
        }

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
            'user' => $user->only(['id', 'full_name', 'email']),
            'permissions' => $permissions,
        ]);
    }
}
