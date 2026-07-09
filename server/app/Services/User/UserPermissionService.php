<?php

namespace App\Services\User;

use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserPermissionService
{
    /**
     * Get user's permissions (role + direct + effective).
     */
    public function getUserPermissions($id): JsonResponse
    {
        $user = User::findOrFail($id);

        $allPermissions = $user->permissions()->get()->groupBy('module');

        $rolePermissions = Permission::whereHas('roles', function ($query) use ($user) {
            $query->whereIn('roles.id', $user->roles->pluck('id'));
        })->get()->pluck('id');

        $directPermissions = $user->directPermissions->pluck('id');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user->only(['id', 'full_name', 'email']),
                'roles' => $user->roles,
                'permissions' => $allPermissions,
                'role_permission_ids' => $rolePermissions->toArray(),
                'direct_permission_ids' => $directPermissions->toArray(),
            ],
        ]);
    }
}
