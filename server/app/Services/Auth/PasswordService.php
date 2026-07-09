<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Services\Token\TokenRefreshService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PasswordService
{
    public function __construct(
        protected TokenRefreshService $refreshService,
    ) {}

    /**
     * Change user password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Current password is incorrect.'], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'temp_password_expires_at' => null,
        ]);

        $this->refreshService->revokeAllUserRefreshTokens($user->id);
        $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return response()->json(['success' => true, 'message' => 'Password changed successfully. Please log in again on other devices.']);
    }

    /**
     * Get new recovery codes.
     */
    public function regenerateRecoveryCodes(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid password.'], 422);
        }

        if (!$user->hasTwoFactorEnabled()) {
            return response()->json(['success' => false, 'message' => 'Two-factor authentication is not enabled.'], 422);
        }

        $newCodes = app(RecoveryCodeService::class)->regenerate($user);

        return response()->json([
            'success' => true,
            'data' => ['recovery_codes' => $newCodes],
            'message' => 'Recovery codes regenerated successfully.',
        ]);
    }

    /**
     * Verify a password against a user's stored hash.
     */
    public function verify(User $user, string $password): bool
    {
        return Hash::check($password, $user->password);
    }
}
