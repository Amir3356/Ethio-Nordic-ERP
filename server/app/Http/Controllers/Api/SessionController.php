<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TokenStateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function __construct(
        private readonly TokenStateService $tokenState
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
        $token->delete();

        return $this->successResponse(null, 'Session revoked successfully.');
    }

    public function active(): JsonResponse
    {
        return $this->successResponse(
            $this->tokenState->getAllSessions()
        );
    }

    public function destroyAllForUser($userId): JsonResponse
    {
        $user = \App\Models\User::find($userId);
        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $count = $this->tokenState->removeAllUserTokens($user);
        $user->tokens()->delete();

        return $this->successResponse([
            'revoked_count' => $count,
        ], "{$count} sessions revoked successfully.");
    }
}
