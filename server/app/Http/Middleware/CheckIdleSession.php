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
            $idleTimeout = config('session.idle_timeout', 30) * 60;

            $lastActivity = $this->tokenState->getLastActivity($tokenId);

            if ($lastActivity) {
                $idleSeconds = now()->timestamp - strtotime($lastActivity);

                if ($idleSeconds > $idleTimeout) {
                    $this->tokenState->blacklistToken($tokenId);
                    $this->tokenState->removeTokenMetadata($tokenId);
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
