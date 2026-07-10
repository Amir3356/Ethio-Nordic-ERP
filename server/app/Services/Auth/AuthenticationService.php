<?php

namespace App\Services\Auth;

use App\Models\RefreshToken;
use App\Models\User;
use App\Services\Token\TokenStateService;
use App\Services\Token\TokenRefreshService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AuthenticationService
{
    public function __construct(
        protected TokenStateService $tokenState,
        protected TokenRefreshService $refreshService,
        protected LoginActivityService $loginActivity,
        protected TwoFactorService $twoFactor,
    ) {}

    /**
     * Login with email and password.
     */
    public function login(Request $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            $this->loginActivity->log($request, null, 'failed', 'Invalid credentials');
            return response()->json(['success' => false, 'message' => 'Invalid credentials.'], 401);
        }

        if (!$user->is_active) {
            $this->loginActivity->log($request, $user, 'failed', 'Account is deactivated');
            return response()->json(['success' => false, 'message' => 'Your account has been deactivated. Please contact administrator.'], 403);
        }

        if ($user->hasExpiredTemporaryPassword()) {
            $this->loginActivity->log($request, $user, 'failed', 'Temporary password expired');
            return response()->json(['success' => false, 'message' => 'Your temporary password has expired. Please contact administrator for a new one.'], 403);
        }

        // Invalidate 2FA secret if it can't be decrypted (wrong APP_KEY)
        if ($user->hasTwoFactorEnabled()) {
            try {
                $user->twoFactorSecret->getDecryptedSecret();
            } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
                \Log::warning('2FA secret decryption failed for user ' . $user->id . ', resetting 2FA. Error: ' . $e->getMessage());
                \App\Models\TwoFactorSecret::where('user_id', $user->id)->delete();
                $user->unsetRelation('twoFactorSecret');
            }
        }

        // Force 2FA setup for new users
        if (!$user->hasTwoFactorEnabled()) {
            if (!$request->two_factor_code) {
                $setupData = $this->twoFactor->provideSetupData($user);
                return response()->json([
                    'success' => true,
                    'data' => array_merge(['requires_2fa_setup' => true], $setupData),
                    'message' => 'Scan the QR code with your authenticator app to set up two-factor authentication.',
                ], 202);
            }

            if (!$this->twoFactor->verify($user, $request->two_factor_code)) {
                $this->loginActivity->log($request, $user, 'failed', 'Invalid 2FA code');
                return response()->json(['success' => false, 'message' => 'Invalid two-factor authentication code.'], 422);
            }

            $this->twoFactor->enable($user);
        }

        // Handle existing 2FA verification
        if ($user->hasTwoFactorEnabled()) {
            if (!$request->two_factor_code) {
                $secret = $user->twoFactorSecret->getDecryptedSecret();
                $qrCodeUrl = $this->twoFactor->generateQrCodeUrl($user->email, $secret);
                return response()->json([
                    'success' => true,
                    'data' => ['requires_2fa' => true, 'qr_code_url' => $qrCodeUrl],
                    'message' => 'Please enter your two-factor authentication code.',
                ], 202);
            }

            if (!$this->twoFactor->verify($user, $request->two_factor_code)) {
                $this->loginActivity->log($request, $user, 'failed', 'Invalid 2FA code');
                return response()->json(['success' => false, 'message' => 'Invalid two-factor authentication code.'], 422);
            }
        }

        $this->loginActivity->log($request, $user, 'success');
        return response()->json([
            'success' => true,
            'data' => $this->completeLogin($user, $request),
            'message' => 'Login successful.',
        ]);
    }

    /**
     * Login using recovery code.
     */
    public function loginWithRecoveryCode(Request $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            $this->loginActivity->log($request, null, 'failed', 'Invalid credentials');
            return response()->json(['success' => false, 'message' => 'Invalid credentials.'], 401);
        }

        if (!$user->is_active) {
            $this->loginActivity->log($request, $user, 'failed', 'Account is deactivated');
            return response()->json(['success' => false, 'message' => 'Your account has been deactivated.'], 403);
        }

        if (!$user->isAdmin()) {
            $this->loginActivity->log($request, $user, 'failed', 'Not an admin');
            return response()->json(['success' => false, 'message' => 'Access denied. Only administrators can log in.'], 403);
        }

        if (!$user->hasTwoFactorEnabled()) {
            return response()->json(['success' => false, 'message' => 'Two-factor authentication is not enabled.'], 422);
        }

        $recoveryCodeService = app(RecoveryCodeService::class);

        if (!$recoveryCodeService->validate($user, $request->recovery_code)) {
            $this->loginActivity->log($request, $user, 'failed', 'Invalid recovery code');
            return response()->json(['success' => false, 'message' => 'Invalid recovery code.'], 401);
        }

        $recoveryCodeService->removeUsed($user, $request->recovery_code);

        $this->loginActivity->log($request, $user, 'success');
        return response()->json([
            'success' => true,
            'data' => $this->completeLogin($user, $request),
            'message' => 'Login successful.',
        ]);
    }

    /**
     * Register new user (admin only).
     */
    public function register(Request $request): JsonResponse
    {
        $tempPassword = Str::random(12);

        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'department' => $request->department,
            'password' => bcrypt($tempPassword),
            'is_active' => false,
            'temp_password_expires_at' => now()->addDays(7),
        ]);

        $user->roles()->sync($request->role_ids);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user->load('roles'),
                'temp_password' => $tempPassword,
            ],
            'message' => 'User registered successfully.',
        ], 201);
    }

    /**
     * Logout user and invalidate current session.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            \App\Models\LoginActivity::where('user_id', $user->id)
                ->whereNull('logout_at')
                ->latest()
                ->first()
                ?->update(['logout_at' => now()]);

            $token = $user->currentAccessToken();
            if ($token) {
                $this->tokenState->blacklistToken($token->id);
                $this->tokenState->removeTokenMetadata($token->id);
                RefreshToken::where('access_token_id', $token->id)->update(['is_revoked' => true]);
                $token->delete();
            }
        }

        return response()->json(['success' => true, 'message' => 'Logged out successfully.']);
    }

    /**
     * Get current user information.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles.permissions']);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'has_2fa_enabled' => $user->hasTwoFactorEnabled(),
                'permissions' => $user->permissions()->get()->groupBy('module'),
            ],
        ]);
    }

    /**
     * Refresh access token using refresh token.
     */
    public function refreshToken(Request $request): JsonResponse
    {
        $result = $this->refreshService->refresh($request->refresh_token, $request);

        if (!$result) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired refresh token. Please log in again.'], 401);
        }

        $accessToken = \Laravel\Sanctum\PersonalAccessToken::find($result['access_token_id']);
        if ($accessToken) {
            $this->tokenState->storeTokenMetadata($result['user'], $accessToken, $request);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'access_token' => $result['access_token'],
                'refresh_token' => $result['refresh_token'],
                'expires_at' => $result['expires_at'],
                'user' => $result['user'],
            ],
            'message' => 'Token refreshed successfully.',
        ]);
    }

    /**
     * Complete the login process: create tokens, log activity, return response data.
     */
    public function completeLogin(User $user, Request $request): array
    {
        $token = $user->createToken('auth-token', ['*'], now()->addHours(12));

        $this->tokenState->storeTokenMetadata($user, $token->accessToken, $request);

        $refreshToken = $this->refreshService->createRefreshToken($user, $token->accessToken, $request);

        $user->recordLogin();

        return [
            'user' => $user->load('roles'),
            'token' => $token->plainTextToken,
            'refresh_token' => $refreshToken->token,
            'expires_at' => $token->accessToken->expires_at,
            'refresh_expires_at' => $refreshToken->expires_at,
        ];
    }
}
