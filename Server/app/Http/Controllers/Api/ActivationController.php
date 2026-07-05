<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivationController extends Controller
{
    public function verifyToken(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $user = User::where('activation_token', $request->token)
            ->where('activation_token_expires_at', '>', now())
            ->where('is_active', false)
            ->first();

        if (!$user) {
            return $this->errorResponse('Invalid or expired activation link.', 422);
        }

        return $this->successResponse([
            'email' => $user->email,
            'full_name' => $user->full_name,
        ], 'Token is valid.');
    }

    public function activateAccount(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('activation_token', $request->token)
            ->where('activation_token_expires_at', '>', now())
            ->where('is_active', false)
            ->first();

        if (!$user) {
            return $this->errorResponse('Invalid or expired activation link.', 422);
        }

        $user->update([
            'is_active' => true,
            'password' => $request->password,
            'activation_token' => null,
            'activation_token_expires_at' => null,
            'temp_password_expires_at' => null,
            'email_verified_at' => now(),
        ]);

        return $this->successResponse(null, 'Account activated successfully. You can now log in.');
    }
}
