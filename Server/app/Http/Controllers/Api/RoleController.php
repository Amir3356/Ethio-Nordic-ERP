<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::withCount('permissions')->orderBy('name')->get();

        return $this->successResponse($roles);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'slug' => 'required|string|max:255|unique:roles,slug',
            'description' => 'nullable|string|max:500',
            'permission_ids' => 'required|array|min:1',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'name' => $request->name,
            'slug' => $request->slug,
            'description' => $request->description,
            'is_active' => true,
            'is_system' => false,
        ]);

        $role->permissions()->sync($request->permission_ids);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'created',
            'module' => 'role_management',
            'entity_type' => Role::class,
            'entity_id' => $role->id,
            'new_values' => $role->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'description' => "Created role {$role->name}",
        ]);

        return $this->successResponse(
            $role->load('permissions'),
            'Role created successfully.',
            201
        );
    }

    public function show($id): JsonResponse
    {
        $role = Role::with('permissions')->findOrFail($id);

        return $this->successResponse($role);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if ($role->is_system) {
            return $this->errorResponse('Cannot modify a system role.', 422);
        }

        $request->validate([
            'name' => "sometimes|string|max:255|unique:roles,name,{$id}",
            'slug' => "sometimes|string|max:255|unique:roles,slug,{$id}",
            'description' => 'nullable|string|max:500',
            'permission_ids' => 'required|array|min:1',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $oldValues = $role->toArray();

        $role->update($request->only(['name', 'slug', 'description']));
        $role->permissions()->sync($request->permission_ids);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'action' => 'updated',
            'module' => 'role_management',
            'entity_type' => Role::class,
            'entity_id' => $role->id,
            'old_values' => $oldValues,
            'new_values' => $role->fresh()->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'description' => "Updated role {$role->name}",
        ]);

        return $this->successResponse(
            $role->fresh()->load('permissions'),
            'Role updated successfully.'
        );
    }

    public function destroy($id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if ($role->is_system) {
            return $this->errorResponse('Cannot delete a system role.', 422);
        }

        if ($role->users()->count() > 0) {
            return $this->errorResponse('Cannot delete a role with assigned users. Reassign users first.', 422);
        }

        AuditLog::create([
            'user_id' => request()->user()->id,
            'user_name' => request()->user()->name,
            'action' => 'deleted',
            'module' => 'role_management',
            'entity_type' => Role::class,
            'entity_id' => $role->id,
            'old_values' => $role->toArray(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'description' => "Deleted role {$role->name}",
        ]);

        $role->permissions()->detach();
        $role->delete();

        return $this->successResponse(null, 'Role deleted successfully.');
    }
}
