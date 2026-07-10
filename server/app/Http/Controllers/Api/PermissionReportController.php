<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;

class PermissionReportController extends Controller
{
    public function getModules(): JsonResponse
    {
        $modules = Permission::select('module')
            ->distinct()
            ->orderBy('module')
            ->pluck('module');

        return $this->successResponse($modules);
    }

    public function getActions(): JsonResponse
    {
        $actions = Permission::select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        return $this->successResponse($actions);
    }

    public function getGroupedByModule(): JsonResponse
    {
        $permissions = Permission::all()->groupBy('module');

        return $this->successResponse($permissions);
    }

    public function getRoleMatrix(): JsonResponse
    {
        $roles = Role::with('permissions')->get();
        $permissions = Permission::all()->groupBy('module');

        $matrix = [];

        foreach ($permissions as $module => $modulePermissions) {
            $matrix[$module] = [];
            
            foreach ($modulePermissions as $permission) {
                $permissionData = [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'slug' => $permission->slug,
                    'action' => $permission->action,
                    'roles' => []
                ];

                foreach ($roles as $role) {
                    $permissionData['roles'][$role->slug] = $role->permissions->contains('id', $permission->id);
                }

                $matrix[$module][] = $permissionData;
            }
        }

        return $this->successResponse([
            'roles' => $roles->map(function($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'permissions_count' => $role->permissions->count(),
                ];
            }),
            'matrix' => $matrix,
        ]);
    }
}