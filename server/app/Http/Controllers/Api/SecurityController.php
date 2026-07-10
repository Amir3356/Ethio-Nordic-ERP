<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SecurityController extends Controller
{
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

    public function suspiciousActivity(): JsonResponse
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
}