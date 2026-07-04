<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;

class PermissionController extends Controller
{
    public function index(): JsonResponse
    {
        $permissions = Permission::orderBy('module')
            ->orderBy('name')
            ->get()
            ->groupBy('module');

        return $this->successResponse($permissions);
    }

    public function show($id): JsonResponse
    {
        $permission = Permission::findOrFail($id);

        return $this->successResponse($permission);
    }

    public function byModule($module): JsonResponse
    {
        $permissions = Permission::where('module', $module)
            ->orderBy('name')
            ->get();

        return $this->successResponse([
            'module' => $module,
            'permissions' => $permissions,
        ]);
    }
}
