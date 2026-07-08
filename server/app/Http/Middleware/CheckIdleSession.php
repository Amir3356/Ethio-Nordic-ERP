<?php

namespace App\Http\Middleware;

use App\Services\TokenStateService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckIdleSession
{
    public function __construct(
        private readonly TokenStateService $tokenState
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        $currentToken = $request->user()->currentAccessToken();

        if ($currentToken) {
            $tokenId = $currentToken->getKey();
            // Read from cache (runtime-configurable) with fallback to config
            $idleTimeout = (\Cache::get('session_idle_timeout_minutes') ?? config('session.idle_timeout', 30)) * 60;

            $lastActivity = $this->tokenState->getLastActivity($tokenId);

            if ($lastActivity) {
                $idleSeconds = now()->timestamp - strtotime($lastActivity);

                if ($idleSeconds > $idleTimeout) {
                    // Blacklist the access token
                    $this->tokenState->blacklistToken($tokenId);
                    // Remove Redis metadata
                    $this->tokenState->removeTokenMetadata($tokenId);
                    // Revoke associated refresh token to prevent token replay
                    \App\Models\RefreshToken::where('access_token_id', $tokenId)
                        ->update(['is_revoked' => true]);
                    // Delete the access token from DB
                    $currentToken->delete();

                    return response()->json([
                        'success' => false,
                        'data' => null,
                        'message' => 'Session expired due to inactivity. Please log in again.',
                    ], 401);
                }
            }

            $this->tokenState->updateLastActivity($tokenId);
        }

        return $next($request);
    }
}
