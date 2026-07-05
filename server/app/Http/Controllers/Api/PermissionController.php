<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PermissionController extends Controller
{
    /**
     * Display a listing of permissions with filtering
     */
    public function index(Request $request): JsonResponse
    {
        $query = Permission::query();

        // Module filter
        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        // Action filter
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'module');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder)->orderBy('action', 'asc');

        $perPage = $request->get('per_page', 50);
        $permissions = $query->paginate($perPage);

        return $this->successResponse($permissions);
    }

    /**
     * Store a newly created permission
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:permissions,slug',
            'module' => 'required|string|max:255',
            'action' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $permission = Permission::create($request->all());

        return $this->successResponse($permission, 'Permission created successfully.', 201);
    }

    /**
     * Display the specified permission with roles
     */
    public function show($id): JsonResponse
    {
        $permission = Permission::with('roles')->findOrFail($id);

        return $this->successResponse($permission);
    }

    /**
     * Update the specified permission
     */
    public function update(Request $request, $id): JsonResponse
    {
        $permission = Permission::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => "sometimes|string|max:255|unique:permissions,slug,{$id}",
            'module' => 'sometimes|string|max:255',
            'action' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $permission->update($request->all());

        return $this->successResponse($permission, 'Permission updated successfully.');
    }

    /**
     * Remove the specified permission
     */
    public function destroy($id): JsonResponse
    {
        $permission = Permission::findOrFail($id);

        // Check if permission is assigned to any roles
        if ($permission->roles()->exists()) {
            return $this->errorResponse(
                'Cannot delete permission that is assigned to roles. Remove from all roles first.',
                422
            );
        }

        $permission->delete();

        return $this->successResponse(null, 'Permission deleted successfully.');
    }

    /**
     * Get all unique modules
     */
    public function getModules(): JsonResponse
    {
        $modules = Permission::select('module')
            ->distinct()
            ->orderBy('module')
            ->pluck('module');

        return $this->successResponse($modules);
    }

    /**
     * Get all unique actions
     */
    public function getActions(): JsonResponse
    {
        $actions = Permission::select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        return $this->successResponse($actions);
    }

    /**
     * Get permissions grouped by module
     */
    public function getGroupedByModule(): JsonResponse
    {
        $permissions = Permission::all()->groupBy('module');

        return $this->successResponse($permissions);
    }

    /**
     * Bulk create permissions for a module
     */
    public function bulkCreate(Request $request): JsonResponse
    {
        $request->validate([
            'module' => 'required|string|max:255',
            'actions' => 'required|array|min:1',
            'actions.*' => 'required|string|max:255',
            'description_template' => 'nullable|string|max:500',
        ]);

        $module = $request->module;
        $actions = $request->actions;
        $descriptionTemplate = $request->description_template ?? '{action} {module}';

        $permissions = [];
        $skipped = [];

        DB::beginTransaction();
        try {
            foreach ($actions as $action) {
                $slug = Str::slug($module . '.' . $action, '.');
                $name = ucwords(str_replace(['-', '_'], ' ', $action)) . ' ' . ucwords(str_replace(['-', '_'], ' ', $module));
                
                // Check if permission already exists
                if (Permission::where('slug', $slug)->exists()) {
                    $skipped[] = $slug;
                    continue;
                }

                $description = str_replace(
                    ['{action}', '{module}'],
                    [ucwords($action), ucwords($module)],
                    $descriptionTemplate
                );

                $permission = Permission::create([
                    'name' => $name,
                    'slug' => $slug,
                    'module' => $module,
                    'action' => $action,
                    'description' => $description,
                ]);

                $permissions[] = $permission;
            }

            DB::commit();

            return $this->successResponse([
                'created' => $permissions,
                'skipped' => $skipped,
                'created_count' => count($permissions),
                'skipped_count' => count($skipped),
            ], 'Bulk permission creation completed.');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to create permissions: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Assign permissions to role
     */
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

    /**
     * Remove permissions from role
     */
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

    /**
     * Sync permissions for a role (replace all)
     */
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

    /**
     * Get role permissions matrix
     */
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

    /**
     * Generate standard ERP permissions for a module
     */
    public function generateStandardPermissions(Request $request): JsonResponse
    {
        $request->validate([
            'module' => 'required|string|max:255',
            'entity' => 'required|string|max:255', // e.g., "User", "Purchase Order", "Invoice"
        ]);

        $module = $request->module;
        $entity = $request->entity;

        // Standard ERP actions
        $standardActions = [
            'view' => "View {$entity} records",
            'create' => "Create new {$entity} records",
            'edit' => "Edit existing {$entity} records",
            'delete' => "Delete {$entity} records",
            'approve' => "Approve {$entity} records",
            'reject' => "Reject {$entity} records",
            'export' => "Export {$entity} data",
            'import' => "Import {$entity} data",
        ];

        $permissions = [];
        $skipped = [];

        DB::beginTransaction();
        try {
            foreach ($standardActions as $action => $description) {
                $slug = Str::slug($module . '.' . $action, '.');
                $name = ucwords($action) . ' ' . $entity;

                // Check if permission already exists
                if (Permission::where('slug', $slug)->exists()) {
                    $skipped[] = $slug;
                    continue;
                }

                $permission = Permission::create([
                    'name' => $name,
                    'slug' => $slug,
                    'module' => $module,
                    'action' => $action,
                    'description' => $description,
                ]);

                $permissions[] = $permission;
            }

            DB::commit();

            return $this->successResponse([
                'created' => $permissions,
                'skipped' => $skipped,
                'created_count' => count($permissions),
                'skipped_count' => count($skipped),
            ], 'Standard ERP permissions generated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to generate permissions: ' . $e->getMessage(), 500);
        }
    }
}