<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PermissionGeneratorController extends Controller
{
    public function generateStandardPermissions(Request $request): JsonResponse
    {
        $request->validate([
            'module' => 'required|string|max:255',
            'entity' => 'required|string|max:255',
        ]);

        $module = $request->module;
        $entity = $request->entity;

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