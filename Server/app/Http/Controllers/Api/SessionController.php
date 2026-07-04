<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('personal_access_tokens')
            ->join('users', 'personal_access_tokens.tokenable_id', '=', 'users.id')
            ->select(
                'personal_access_tokens.id',
                'personal_access_tokens.name as device_name',
                'personal_access_tokens.last_used_at',
                'personal_access_tokens.created_at as login_at',
                'users.id as user_id',
                'users.name as user_name',
                'users.email as user_email'
            );

        if ($request->filled('user_id')) {
            $query->where('personal_access_tokens.tokenable_id', $request->user_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                  ->orWhere('users.email', 'like', "%{$search}%")
                  ->orWhere('personal_access_tokens.name', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $sessions = $query->orderBy('personal_access_tokens.last_used_at', 'desc')
            ->paginate($perPage);

        return $this->successResponse($sessions);
    }

    public function destroy($tokenId): JsonResponse
    {
        $token = DB::table('personal_access_tokens')->where('id', $tokenId)->first();

        if (!$token) {
            return $this->errorResponse('Session not found.', 404);
        }

        DB::table('personal_access_tokens')->where('id', $tokenId)->delete();

        return $this->successResponse(null, 'Session revoked successfully.');
    }

    public function destroyAllForUser($userId): JsonResponse
    {
        $user = User::findOrFail($userId);
        $currentUser = request()->user();

        $deletedCount = DB::table('personal_access_tokens')
            ->where('tokenable_id', $userId)
            ->where('id', '!=', $currentUser->currentAccessToken()?->id ?? 0)
            ->delete();

        return $this->successResponse([
            'revoked_count' => $deletedCount,
        ], "{$deletedCount} sessions revoked successfully.");
    }

    public function forceLogout(Request $request, $userId): JsonResponse
    {
        $user = User::findOrFail($userId);

        $deletedCount = DB::table('personal_access_tokens')
            ->where('tokenable_id', $userId)
            ->delete();

        return $this->successResponse([
            'user' => $user->only(['id', 'name', 'email']),
            'revoked_count' => $deletedCount,
        ], "User {$user->name} has been logged out from all sessions.");
    }

    public function sessionStats(): JsonResponse
    {
        $totalSessions = DB::table('personal_access_tokens')->count();

        $sessionsByUser = DB::table('personal_access_tokens')
            ->join('users', 'personal_access_tokens.tokenable_id', '=', 'users.id')
            ->select('users.id', 'users.name', 'users.email')
            ->selectRaw('count(*) as session_count')
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderByDesc('session_count')
            ->get();

        $sessionsByDevice = DB::table('personal_access_tokens')
            ->select('name as device_name')
            ->selectRaw('count(*) as session_count')
            ->groupBy('name')
            ->orderByDesc('session_count')
            ->get();

        $activeToday = DB::table('personal_access_tokens')
            ->where('last_used_at', '>=', now()->startOfDay())
            ->count();

        $activeThisWeek = DB::table('personal_access_tokens')
            ->where('last_used_at', '>=', now()->startOfWeek())
            ->count();

        return $this->successResponse([
            'total_sessions' => $totalSessions,
            'active_today' => $activeToday,
            'active_this_week' => $activeThisWeek,
            'by_user' => $sessionsByUser,
            'by_device' => $sessionsByDevice,
        ]);
    }
}
