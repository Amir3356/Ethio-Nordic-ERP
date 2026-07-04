<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\LoginActivity;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $totalRoles = Role::count();

        $recentLogins = LoginActivity::with('user')
            ->where('status', 'success')
            ->orderBy('login_at', 'desc')
            ->limit(5)
            ->get();

        $recentAuditLogs = AuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $threshold = now()->subMinutes(15);
        $onlineUsersCount = LoginActivity::where('status', 'success')
            ->where('is_active', true)
            ->where('login_at', '>=', $threshold)
            ->whereNull('logout_at')
            ->distinct('user_id')
            ->count('user_id');

        $failedLogins24h = LoginActivity::where('status', 'failed')
            ->where('login_at', '>=', now()->subHours(24))
            ->count();

        return $this->successResponse([
            'total_users' => $totalUsers,
            'active_users' => $activeUsers,
            'inactive_users' => $totalUsers - $activeUsers,
            'total_roles' => $totalRoles,
            'online_users_count' => $onlineUsersCount,
            'failed_logins_24h' => $failedLogins24h,
            'recent_logins' => $recentLogins,
            'recent_audit_logs' => $recentAuditLogs,
        ]);
    }
}
