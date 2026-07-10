<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Permission::query();

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->get('sort_by', 'module');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder)->orderBy('action', 'asc');

        $perPage = $request->get('per_page', 50);
        $permissions = $query->paginate($perPage);

        return $this->successResponse($permissions);
    }

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

    public function show($id): JsonResponse
    {
        $permission = Permission::with('roles')->findOrFail($id);

        return $this->successResponse($permission);
    }

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

    public function destroy($id): JsonResponse
    {
        $permission = Permission::findOrFail($id);

        if ($permission->roles()->exists()) {
            return $this->errorResponse(
                'Cannot delete permission that is assigned to roles. Remove from all roles first.',
                422
            );
        }

        $permission->delete();

        return $this->successResponse(null, 'Permission deleted successfully.');
    }
}