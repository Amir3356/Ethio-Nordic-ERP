<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function auditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::with('user');

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('model_type')) {
            $query->where('model_type', $request->model_type);
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        // Handle -created_at format (sorting)
        if (str_starts_with($sortBy, '-')) {
            $sortOrder = 'desc';
            $sortBy = substr($sortBy, 1);
        }

        $query->orderBy($sortBy, $sortOrder);
        $perPage = $request->get('per_page', 15);
        $logs = $query->paginate($perPage);

        return $this->successResponse($logs);
    }

    public function showAuditLog($id): JsonResponse
    {
        $log = AuditLog::with('user')->findOrFail($id);
        return $this->successResponse($log);
    }

    public function exportAuditCsv(Request $request)
    {
        $query = AuditLog::with('user');

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        $csv = "User,Action,Module,Model Type,Model ID,Timestamp,IP Address\n";
        foreach ($logs as $log) {
            $csv .= "\"{$log->user_email}\",\"{$log->action}\",\"{$log->module}\",\"{$log->model_type}\",{$log->model_id},\"{$log->created_at}\",\"{$log->ip_address}\"\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="audit-logs-' . now()->format('Y-m-d-H-i-s') . '.csv"',
        ]);
    }
}