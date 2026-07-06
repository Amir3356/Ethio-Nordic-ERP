<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('sessions')
            ->join('users', 'sessions.user_id', '=', 'users.id')
            ->select(
                'sessions.id',
                'sessions.user_agent',
                'sessions.last_activity',
                'sessions.payload',
                'users.id as user_id',
                'users.full_name as user_name',
                'users.email as user_email'
            );

        if ($request->filled('user_id')) {
            $query->where('sessions.user_id', $request->user_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('users.full_name', 'like', "%{$search}%")
                  ->orWhere('users.email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $sessions = $query->orderBy('sessions.last_activity', 'desc')
            ->paginate($perPage);

        return $this->successResponse($sessions);
    }

    public function destroy($sessionId): JsonResponse
    {
        $deleted = DB::table('sessions')->where('id', $sessionId)->delete();

        if (!$deleted) {
            return $this->errorResponse('Session not found.', 404);
        }

        return $this->successResponse(null, 'Session revoked successfully.');
    }

    public function destroyAllForUser($userId): JsonResponse
    {
        $deletedCount = DB::table('sessions')->where('user_id', $userId)->delete();

        return $this->successResponse([
            'revoked_count' => $deletedCount,
        ], "{$deletedCount} sessions revoked successfully.");
    }
}
