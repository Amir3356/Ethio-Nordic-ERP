<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PermissionBulkController extends Controller
{
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
}