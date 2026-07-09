<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Services\Token\TokenStateService;
use App\Services\Token\TokenRefreshService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionService
{
    public function __construct(
        protected TokenStateService $tokenState,
        protected TokenRefreshService $refreshService,
    ) {}

    /**
     * Get active sessions for current user.
     */
    public function activeSessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = (string) $request->user()->currentAccessToken()->id;

        $redisSessions = $this->tokenState->getActiveSessions($user);

        $sessions = array_map(fn($s) => [
            'id' => $s['id'],
            'name' => $s['token_name'] ?? 'auth-token',
            'device_type' => $s['device_type'] ?? null,
            'browser' => $s['browser'] ?? null,
            'platform' => $s['platform'] ?? null,
            'ip_address' => $s['ip_address'] ?? null,
            'last_used_at' => $s['last_used_at'] ?? null,
            'created_at' => $s['created_at'] ?? null,
            'expires_at' => $s['expires_at'] ?? null,
            'is_current' => (string) $s['id'] === $currentTokenId,
        ], $redisSessions);

        return response()->json(['success' => true, 'data' => array_values($sessions)]);
    }

    /**
     * Revoke specific session.
     */
    public function revokeSession(Request $request, $tokenId): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = (int) $request->user()->currentAccessToken()->id;

        if ((int) $tokenId === $currentTokenId) {
            return response()->json(['success' => false, 'message' => 'Cannot revoke current session.'], 422);
        }

        $token = $user->tokens()->findOrFail($tokenId);

        $this->tokenState->blacklistToken($token->id);
        $this->tokenState->removeTokenMetadata($token->id);
        \App\Models\RefreshToken::where('access_token_id', $token->id)->update(['is_revoked' => true]);
        $token->delete();

        return response()->json(['success' => true, 'message' => 'Session revoked successfully.']);
    }

    /**
     * Revoke all other sessions except current.
     */
    public function revokeAllOtherSessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = (int) $request->user()->currentAccessToken()->id;

        $this->tokenState->removeAllUserTokens($user, $currentTokenId);
        $this->refreshService->revokeAllUserRefreshTokens($user->id);

        $revokedCount = $user->tokens()->where('id', '!=', $currentTokenId)->count();
        $user->tokens()->where('id', '!=', $currentTokenId)->delete();

        return response()->json([
            'success' => true,
            'data' => ['revoked_count' => $revokedCount],
            'message' => "Revoked {$revokedCount} sessions successfully.",
        ]);
    }
}
