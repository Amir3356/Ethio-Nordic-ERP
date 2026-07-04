<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

    public function userActivity($id): JsonResponse
    {
        $user = User::findOrFail($id);
        $activities = $user->loginActivities()
            ->orderBy('login_at', 'desc')
            ->paginate(15);

        return $this->successResponse([
            'user' => $user->only(['id', 'name', 'email']),
            'activities' => $activities,
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
                    'name' => $user->name,
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
