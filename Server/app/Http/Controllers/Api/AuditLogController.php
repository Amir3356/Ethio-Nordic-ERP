<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        if ($request->filled('entity_id')) {
            $query->where('entity_id', $request->entity_id);
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return $this->successResponse($logs);
    }

    public function show($id): JsonResponse
    {
        $log = AuditLog::with('user')->findOrFail($id);

        $entity = $log->getEntity();

        return $this->successResponse([
            'log' => $log,
            'entity' => $entity,
        ]);
    }

    public function entityHistory($entityType, $entityId): JsonResponse
    {
        $logs = AuditLog::where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return $this->successResponse([
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'history' => $logs,
        ]);
    }

    public function moduleHistory($module): JsonResponse
    {
        $logs = AuditLog::where('module', $module)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return $this->successResponse([
            'module' => $module,
            'history' => $logs,
        ]);
    }

    public function userHistory($userId): JsonResponse
    {
        $logs = AuditLog::where('user_id', $userId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return $this->successResponse([
            'user_id' => $userId,
            'history' => $logs,
        ]);
    }
}
