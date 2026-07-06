<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LoginActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LoginActivity::with('user');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('ip_address')) {
            $query->where('ip_address', 'like', "%{$request->ip_address}%");
        }

        if ($request->filled('date_from')) {
            $query->where('login_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('login_at', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 15);
        $activities = $query->orderBy('login_at', 'desc')->paginate($perPage);

        return $this->successResponse($activities);
    }

    public function show($id): JsonResponse
    {
        $activity = LoginActivity::with('user')->findOrFail($id);
        return $this->successResponse($activity);
    }

    public function getUserActivity($id, Request $request): JsonResponse
    {
        $user = User::findOrFail($id);
        $perPage = $request->get('per_page', 15);
        $activities = $user->loginActivities()
            ->orderBy('login_at', 'desc')
            ->paginate($perPage);

        return $this->successResponse([
            'user' => $user->only(['id', 'full_name', 'email']),
            'activities' => $activities,
        ]);
    }

    /**
     * Get audit logs
     */
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

    /**
     * Show a single audit log
     */
    public function showAuditLog($id): JsonResponse
    {
        $log = AuditLog::with('user')->findOrFail($id);
        return $this->successResponse($log);
    }

    /**
     * Export audit logs to CSV
     */
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

    public function stats(Request $request): JsonResponse
    {
        $query = LoginActivity::query();

        if ($request->filled('date_from')) {
            $query->where('login_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('login_at', '<=', $request->date_to);
        }

        $total = (clone $query)->count();
        $successful = (clone $query)->where('status', 'success')->count();
        $failed = (clone $query)->where('status', 'failed')->count();
        $uniqueIps = (clone $query)->where('status', 'success')->distinct('ip_address')->count('ip_address');

        $dailyLogins = (clone $query)
            ->where('status', 'success')
            ->where('login_at', '>=', now()->subDays(30))
            ->select(DB::raw('DATE(login_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $this->successResponse([
            'total' => $total,
            'successful' => $successful,
            'failed' => $failed,
            'unique_ips' => $uniqueIps,
            'success_rate' => $total > 0 ? round(($successful / $total) * 100, 2) : 0,
            'daily_logins' => $dailyLogins,
        ]);
    }

    public function failedLogins(Request $request): JsonResponse
    {
        $query = LoginActivity::where('status', 'failed');

        if ($request->filled('date_from')) {
            $query->where('login_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('login_at', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 15);
        $failedLogins = $query->with('user')->orderBy('login_at', 'desc')->paginate($perPage);

        return $this->successResponse($failedLogins);
    }

    public function suspiciousActivity(Request $request): JsonResponse
    {
        $threshold = now()->subHours(24);
        $ipThreshold = 5;

        // Find IPs with many failed logins
        $suspiciousIps = LoginActivity::where('status', 'failed')
            ->where('login_at', '>=', $threshold)
            ->select('ip_address', DB::raw('count(*) as attempt_count'))
            ->groupBy('ip_address')
            ->having('attempt_count', '>=', $ipThreshold)
            ->pluck('ip_address');

        $activities = LoginActivity::whereIn('ip_address', $suspiciousIps)
            ->with('user')
            ->orderBy('login_at', 'desc')
            ->paginate(15);

        return $this->successResponse([
            'suspicious_ip_count' => $suspiciousIps->count(),
            'activities' => $activities,
        ]);
    }

    public function onlineUsers(): JsonResponse
    {
        $threshold = now()->subMinutes(15);

        $onlineUserIds = LoginActivity::where('status', 'success')
            ->where('is_active', true)
            ->where('login_at', '>=', $threshold)
            ->whereNull('logout_at')
            ->distinct('user_id')
            ->pluck('user_id');

        $users = User::whereIn('id', $onlineUserIds)
            ->get()
            ->map(function ($user) {
                $lastActivity = $user->loginActivities()
                    ->where('status', 'success')
                    ->where('is_active', true)
                    ->latest('login_at')
                    ->first();

                return [
                    'id' => $user->id,
                    'name' => $user->full_name,
                    'email' => $user->email,
                    'last_activity' => $lastActivity?->login_at,
                    'ip_address' => $lastActivity?->ip_address,
                    'device' => $lastActivity?->device_name,
                ];
            });

        return $this->successResponse([
            'count' => $users->count(),
            'users' => $users,
        ]);
    }
}
