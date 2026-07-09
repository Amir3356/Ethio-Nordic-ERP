<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AccountActivationService
{
    /**
     * Activate user account via email link.
     */
    public function activateAccount(Request $request): JsonResponse
    {
        $email = $this->decodeEmailFromToken($request->token);

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['success' => false, 'message' => 'Invalid activation token.'], 422);
        }

        if (strtolower($request->email) !== strtolower($email)) {
            return response()->json(['success' => false, 'message' => 'Email does not match the activation token.'], 422);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found.'], 404);
        }

        if ($user->is_active) {
            return response()->json(['success' => false, 'message' => 'Account is already activated.'], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'is_active' => true,
            'temp_password_expires_at' => null,
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Account activated successfully. You can now set up Two-Factor Authentication.',
        ]);
    }

    /**
     * Decode email from activation token.
     */
    public function decodeEmailFromToken(string $token): ?string
    {
        $email = str_replace(' ', '+', urldecode($token));
        $email = base64_decode($email, true);
        return $email;
    }
}
