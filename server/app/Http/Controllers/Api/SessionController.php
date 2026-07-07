<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TokenRefreshService;
use App\Services\TokenStateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function __construct(
        private readonly TokenStateService $tokenState,
        private readonly TokenRefreshService $refreshService
    ) {}

    /**
     * List all active sessions system-wide (admin view).
     * Returns fullname, email, device, location metadata for each session.
     */
    public function index(Request $request): JsonResponse
    {
        $sessions = $this->tokenState->getAllSessions(
            search: $request->search,
            userId: $request->user_id
        );

        $perPage = (int) $request->get('per_page', 15);
        $page = (int) $request->get('page', 1);
        $total = count($sessions);
        $offset = ($page - 1) * $perPage;
        $items = array_slice($sessions, $offset, $perPage);

        // Enrich each session with full metadata
        $enriched = array_map(fn($s) => [
            'id' => $s['id'] ?? null,
            'user_id' => $s['user_id'] ?? null,
            'user_name' => $s['user_name'] ?? null,
            'user_email' => $s['user_email'] ?? null,
            'ip_address' => $s['ip_address'] ?? null,
            'device_type' => $s['device_type'] ?? null,
            'browser' => $s['browser'] ?? null,
            'platform' => $s['platform'] ?? null,
            'location' => $s['location'] ?? null,
            'last_used_at' => $s['last_used_at'] ?? null,
            'last_activity_at' => $s['last_activity_at'] ?? null,
            'created_at' => $s['created_at'] ?? null,
            'expires_at' => $s['expires_at'] ?? null,
        ], $items);

        return $this->successResponse([
            'data' => array_values($enriched),
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => (int) ceil($total / $perPage),
        ]);
    }

    /**
     * Admin: Force terminate any session (e.g., on suspected compromise or employee termination).
     * Blacklists the token, removes metadata, revokes refresh tokens, and deletes the access token.
     */
    public function destroy($tokenId): JsonResponse
    {
        $result = $this->tokenState->forceTerminateSession($tokenId);

        if (!$result) {
            return $this->errorResponse('Session not found.', 404);
        }

        return $this->successResponse(null, 'Session terminated successfully.');
    }

    /**
     * Get all active sessions with full metadata (simplified list view).
     */
    public function active(): JsonResponse
    {
        $sessions = $this->tokenState->getAllSessions();

        return $this->successResponse(
            array_map(fn($s) => [
                'id' => $s['id'] ?? null,
                'user_id' => $s['user_id'] ?? null,
                'user_name' => $s['user_name'] ?? null,
                'user_email' => $s['user_email'] ?? null,
                'ip_address' => $s['ip_address'] ?? null,
                'device_type' => $s['device_type'] ?? null,
                'browser' => $s['browser'] ?? null,
                'platform' => $s['platform'] ?? null,
                'location' => $s['location'] ?? null,
                'last_used_at' => $s['last_used_at'] ?? null,
                'last_activity_at' => $s['last_activity_at'] ?? null,
                'created_at' => $s['created_at'] ?? null,
                'expires_at' => $s['expires_at'] ?? null,
            ], $sessions)
        );
    }

    /**
     * Admin: Force terminate ALL sessions for a specific user.
     * Used for suspected compromise or employee termination.
     */
    public function destroyAllForUser($userId): JsonResponse
    {
        $user = \App\Models\User::find($userId);
        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $count = $this->tokenState->forceTerminateAllUserSessions($user->id);

        return $this->successResponse([
            'revoked_count' => $count,
        ], "{$count} sessions terminated successfully for user {$user->full_name}.");
    }

    /**
     * Get the current idle session timeout configuration.
     */
    public function getIdleTimeout(): JsonResponse
    {
        $timeoutMinutes = \Cache::get('session_idle_timeout_minutes', config('session.idle_timeout', 30));

        return $this->successResponse([
            'idle_timeout_minutes' => (int) $timeoutMinutes,
            'default_minutes' => (int) config('session.idle_timeout', 30),
            'description' => 'Sessions with no activity for this duration will be automatically expired.',
        ]);
    }

    /**
     * Update the idle session timeout (admin only).
     * Changes take effect immediately for all new requests.
     */
    public function updateIdleTimeout(\Illuminate\Http\Request $request): JsonResponse
    {
        $request->validate([
            'idle_timeout_minutes' => 'required|integer|min:5|max:480',
        ]);

        $minutes = (int) $request->idle_timeout_minutes;

        // Store in cache (Redis) — persists across requests without restart
        \Cache::put('session_idle_timeout_minutes', $minutes, now()->addYear());

        return $this->successResponse([
            'idle_timeout_minutes' => $minutes,
            'message' => "Idle session timeout updated to {$minutes} minutes. Changes take effect immediately.",
        ]);
    }
}
