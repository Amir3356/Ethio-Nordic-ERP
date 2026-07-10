<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionAssignmentController extends Controller
{
    public function assignToRole(Request $request, $roleId): JsonResponse
    {
        $role = Role::findOrFail($roleId);

        $request->validate([
            'permission_ids' => 'required|array|min:1',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role->permissions()->syncWithoutDetaching($request->permission_ids);

        return $this->successResponse(
            $role->fresh()->load('permissions'),
            'Permissions assigned to role successfully.'
        );
    }

    public function removeFromRole(Request $request, $roleId): JsonResponse
    {
        $role = Role::findOrFail($roleId);

        $request->validate([
            'permission_ids' => 'required|array|min:1',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role->permissions()->detach($request->permission_ids);

        return $this->successResponse(
            $role->fresh()->load('permissions'),
            'Permissions removed from role successfully.'
        );
    }

    public function syncRolePermissions(Request $request, $roleId): JsonResponse
    {
        $role = Role::findOrFail($roleId);

        $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role->permissions()->sync($request->permission_ids);

        return $this->successResponse(
            $role->fresh()->load('permissions'),
            'Role permissions synchronized successfully.'
        );
    }
}