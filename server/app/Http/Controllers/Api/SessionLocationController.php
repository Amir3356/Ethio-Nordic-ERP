<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Token\TokenStateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionLocationController extends Controller
{
    public function __construct(
        private readonly TokenStateService $tokenState
    ) {}

    /**
     * Update session location (e.g., from browser geolocation).
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

        if ($token->tokenable_id !== $request->user()->id) {
            return $this->errorResponse('Unauthorized to update this session.', 403);
        }

        $this->tokenState->updateSessionLocation($tokenId, $request->location);

        $token->update(['location' => $request->location]);

        return $this->successResponse(null, 'Session location updated successfully.');
    }
}