<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Token\TokenStateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\User;

class SessionController extends Controller
{
    public function __construct(
        private readonly TokenStateService $tokenState
    ) {}

    /**
     * List all active sessions system-wide (admin view).
     */
    public function index(Request $request): JsonResponse
    {
        $sessions = $this->tokenState->getAllSessions(
            search: $request->search,
            userId: $request->user_id
        );

        $currentTokenId = (string) $request->user()?->currentAccessToken()?->getKey();

        $perPage = (int) $request->get('per_page', 15);
        $page = (int) $request->get('page', 1);
        $total = count($sessions);
        $offset = ($page - 1) * $perPage;
        $items = array_slice($sessions, $offset, $perPage);

        $enriched = array_map(fn($s) => [
            'id' => $s['id'] ?? null,
            'user_id' => $s['user_id'] ?? null,
            'user_name' => $s['user_name'] ?? null,
            'user_email' => $s['user_email'] ?? null,
            'device_type' => $s['device_type'] ?? null,
            'location' => $s['location'] ?? null,
            'is_current' => $currentTokenId !== null && (string) ($s['id'] ?? '') === $currentTokenId,
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
     * Force terminate any session including current.
     */
    public function destroy(Request $request, $tokenId): JsonResponse
    {
        $result = $this->tokenState->forceTerminateSession($tokenId);

        if (!$result) {
            return $this->errorResponse('Session not found.', 404);
        }

        return $this->successResponse(null, 'Session terminated successfully.');
    }

    /**
     * Get all active sessions with full metadata.
     */
    public function active(Request $request): JsonResponse
    {
        $sessions = $this->tokenState->getAllSessions();

        $currentTokenId = (string) $request->user()?->currentAccessToken()?->getKey();

        return $this->successResponse(
            array_map(fn($s) => [
                'id' => $s['id'] ?? null,
                'user_id' => $s['user_id'] ?? null,
                'user_name' => $s['user_name'] ?? null,
                'user_email' => $s['user_email'] ?? null,
                'device_type' => $s['device_type'] ?? null,
                'location' => $s['location'] ?? null,
                'is_current' => $currentTokenId !== null && (string) ($s['id'] ?? '') === $currentTokenId,
            ], $sessions)
        );
    }

    /**
     * Admin: Force terminate ALL sessions for a specific user.
     */
    public function destroyAllForUser($userId): JsonResponse
    {
        $user = User::find($userId);
        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $count = $this->tokenState->forceTerminateAllUserSessions($user->id);

        return $this->successResponse([
            'revoked_count' => $count,
        ], "{$count} sessions terminated successfully for user {$user->full_name}.");
    }

    /**
     * Update the location for a specific session.
     */
    public function updateLocation(Request $request, string $tokenId): JsonResponse
    {
        $request->validate([
            'location' => 'required|string|max:255',
        ]);

        $this->tokenState->updateSessionLocation($tokenId, $request->input('location'));

        return $this->successResponse(null, 'Session location updated.');
    }

    /**
     * Get idle timeout configuration.
     */
    public function getIdleTimeout(): JsonResponse
    {
        $timeout = \Cache::get('session_idle_timeout_minutes') ?? config('session.idle_timeout', 30);

        return $this->successResponse(['idle_timeout' => $timeout]);
    }

    /**
     * Update idle timeout configuration (admin only).
     */
    public function updateIdleTimeout(Request $request): JsonResponse
    {
        $request->validate([
            'idle_timeout' => 'required|integer|min:5|max:480',
        ]);

        \Cache::put('session_idle_timeout_minutes', $request->input('idle_timeout'));

        return $this->successResponse(null, 'Idle timeout updated successfully.');
    }
}