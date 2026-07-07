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
            'data' => array_values($items),
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => (int) ceil($total / $perPage),
        ]);
    }

    public function destroy($tokenId): JsonResponse
    {
        $token = \Laravel\Sanctum\PersonalAccessToken::find($tokenId);
        if (!$token) {
            return $this->errorResponse('Session not found.', 404);
        }

        $this->tokenState->blacklistToken($token->id);
        $this->tokenState->removeTokenMetadata($token->id);
        \App\Models\RefreshToken::where('access_token_id', $token->id)->update(['is_revoked' => true]);
        $token->delete();

        return $this->successResponse(null, 'Session terminated successfully.');
    }

    public function active(): JsonResponse
    {
        $sessions = $this->tokenState->getAllSessions();

        return $this->successResponse(
            array_map(fn($s) => [
                'id' => $s['id'] ?? null,
                'user_name' => $s['user_name'] ?? null,
                'user_email' => $s['user_email'] ?? null,
                'ip_address' => $s['ip_address'] ?? null,
                'device_type' => $s['device_type'] ?? null,
                'browser' => $s['browser'] ?? null,
                'platform' => $s['platform'] ?? null,
                'location' => $s['location'] ?? null,
                'last_used_at' => $s['last_used_at'] ?? null,
                'created_at' => $s['created_at'] ?? null,
                'expires_at' => $s['expires_at'] ?? null,
            ], $sessions)
        );
    }

    public function destroyAllForUser($userId): JsonResponse
    {
        $user = \App\Models\User::find($userId);
        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $count = $this->tokenState->removeAllUserTokens($user);
        $this->refreshService->revokeAllUserRefreshTokens($user->id);
        $user->tokens()->delete();

        return $this->successResponse([
            'revoked_count' => $count,
        ], "{$count} sessions terminated successfully.");
    }
}
