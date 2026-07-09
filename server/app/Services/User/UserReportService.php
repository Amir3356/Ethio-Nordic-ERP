<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserReportService
{
    /**
     * Get access review report for inactive users.
     */
    public function accessReviewReport(Request $request): JsonResponse
    {
        $inactiveDays = $request->get('inactive_days', 90);

        $users = User::with(['roles'])
            ->where(function ($query) use ($inactiveDays) {
                $query->whereNull('last_login_at')
                    ->orWhere('last_login_at', '<', now()->subDays($inactiveDays));
            })
            ->get()
            ->map(fn($user) => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'department' => $user->department,
                'roles' => $user->roles->pluck('name'),
                'last_login' => $user->last_login_at?->format('Y-m-d H:i:s'),
                'days_since_login' => $user->last_login_at ? $user->last_login_at->diffInDays(now()) : null,
                'is_active' => $user->is_active,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'inactive_days_threshold' => $inactiveDays,
                'total_inactive_users' => $users->count(),
                'users' => $users,
            ],
        ]);
    }
}
