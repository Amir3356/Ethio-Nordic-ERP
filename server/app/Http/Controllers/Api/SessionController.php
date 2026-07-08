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

        return $this->successResponse([
            'data' => array_values($this->formatSessions($items)),
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

        return $this->successResponse($this->formatSessions($sessions));
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

    /**
     * Update session location (e.g., from browser geolocation).
     * Allows users to update their own session location when IP-based geolocation fails.
     */
    public function updateLocation(Request $request, string $tokenId): JsonResponse
    {
        $request->validate([
            'location' => 'required|string|max:255',
        ]);

        $token = \Laravel\Sanctum\PersonalAccessToken::find($tokenId);
        if (!$token) {
            return $this->errorResponse('Session not found.', 404);
        }

        // Only allow users to update their own session location
        if ($token->tokenable_id !== $request->user()->id) {
            return $this->errorResponse('Unauthorized to update this session.', 403);
        }

        $this->tokenState->updateSessionLocation($tokenId, $request->location);

        // Also persist to database
        $token->update(['location' => $request->location]);

        return $this->successResponse(null, 'Session location updated successfully.');
    }

    /**
     * Format sessions array to consistent API response structure.
     */
    private function formatSessions(array $sessions): array
    {
        return array_map(fn($s) => [
            'id' => $s['id'] ?? null,
            'user_id' => $s['user_id'] ?? null,
            'user_name' => $s['user_name'] ?? null,
            'user_email' => $s['user_email'] ?? null,
            'device_type' => $s['device_type'] ?? null,
            'location' => $s['location'] ?? null,
        ], $sessions);
    }
}
