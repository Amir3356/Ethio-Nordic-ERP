<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\TwoFactorSetupMail;
use App\Models\LoginActivity;
use App\Models\TwoFactorSecret;
use App\Models\User;
use App\Services\TokenStateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use PragmaRX\Google2FA\Google2FA;

class AuthController extends Controller
{
    public function __construct(
        private readonly TokenStateService $tokenState,
        private readonly \App\Services\TokenRefreshService $refreshService
    ) {}

    /**
     * Activate user account via email link
     * User sets their permanent password and account becomes active
     */
    public function activateAccount(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'password' => ['required', Password::min(8)
                ->letters()
                ->mixedCase()
                ->numbers()
                ->symbols()],
        ]);

        // Decode the token (base64 encoded email)
        $email = base64_decode($request->token, true);

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->errorResponse('Invalid activation token.', 422);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        if ($user->is_active) {
            return $this->errorResponse('Account is already activated.', 422);
        }

        // Activate user and set permanent password
        $user->update([
            'password' => Hash::make($request->password),
            'is_active' => true,
            'temp_password_expires_at' => null,
            'email_verified_at' => now(),
        ]);

        return $this->successResponse(null, 'Account activated successfully. You can now log in.');
    }

    /**
     * Login with email, password, and confirm_password
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'confirm_password' => 'required|string',
            'two_factor_code' => 'nullable|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            $this->logLoginAttempt($request, $user, 'failed', 'Invalid credentials');
            return $this->errorResponse('Invalid credentials.', 401);
        }

        // Validate confirm_password matches password
        if (!Hash::check($request->confirm_password, $user->password)) {
            $this->logLoginAttempt($request, $user, 'failed', 'Confirm password mismatch');
            return $this->errorResponse('Passwords do not match. Please re-enter your password.', 401);
        }

        if (!$user->is_active) {
            $this->logLoginAttempt($request, $user, 'failed', 'Account is deactivated');
            return $this->errorResponse('Your account has been deactivated. Please contact administrator.', 403);
        }

        if (!$user->isAdmin()) {
            $this->logLoginAttempt($request, $user, 'failed', 'Not an admin');
            return $this->errorResponse('Access denied. Only administrators can log in.', 403);
        }

        // Check if temporary password has expired
        if ($user->hasExpiredTemporaryPassword()) {
            $this->logLoginAttempt($request, $user, 'failed', 'Temporary password expired');
            return $this->errorResponse('Your temporary password has expired. Please contact administrator for a new one.', 403);
        }

        // Handle 2FA verification
        if ($user->hasTwoFactorEnabled()) {
            if (!$request->two_factor_code) {
                return $this->successResponse([
                    'requires_2fa' => true,
                    'message' => 'Two-factor authentication code required',
                ], 'Two-factor authentication code required', 202);
            }

            if (!$this->verifyTwoFactorCode($user, $request->two_factor_code)) {
                $this->logLoginAttempt($request, $user, 'failed', 'Invalid 2FA code');
                return $this->errorResponse('Invalid two-factor authentication code.', 401);
            }
        }

        return $this->loginUser($request, $user);
    }

    /**
     * Register new user (admin only)
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'department' => 'required|string|max:255',
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $tempPassword = Str::random(12);

        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'department' => $request->department,
            'password' => Hash::make($tempPassword),
            'is_active' => true,
            'temp_password_expires_at' => now()->addDays(7),
        ]);

        $user->roles()->sync($request->role_ids);

        return $this->successResponse([
            'user' => $user->load('roles'),
            'temp_password' => $tempPassword,
        ], 'User registered successfully.', 201);
    }

    /**
     * Logout user and invalidate current session tokens only.
     * Only the current session's access token and refresh token are revoked.
     * Other sessions remain active (use revoke-all-sessions to terminate all).
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            LoginActivity::where('user_id', $user->id)
                ->whereNull('logout_at')
                ->latest()
                ->first()
                ?->update(['logout_at' => now()]);

            $token = $request->user()->currentAccessToken();
            if ($token) {
                $this->tokenState->blacklistToken($token->id);
                $this->tokenState->removeTokenMetadata($token->id);

                // Revoke only the refresh token associated with this access token
                \App\Models\RefreshToken::where('access_token_id', $token->id)
                    ->update(['is_revoked' => true]);

                $token->delete();
            }
        }

        return $this->successResponse(null, 'Logged out successfully.');
    }

    /**
     * Get current user information
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles.permissions']);

        return $this->successResponse([
            'user' => $user,
            'has_2fa_enabled' => $user->hasTwoFactorEnabled(),
            'permissions' => $user->permissions()->get()->groupBy('module'),
        ]);
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(8)
                ->letters()
                ->mixedCase()
                ->numbers()
                ->symbols()],
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->errorResponse('Current password is incorrect.', 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'temp_password_expires_at' => null,
        ]);

        $this->refreshService->revokeAllUserRefreshTokens($user->id);
        $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return $this->successResponse(null, 'Password changed successfully. Please log in again on other devices.');
    }

    /**
     * Setup Two-Factor Authentication
     */
    public function setupTwoFactor(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasTwoFactorEnabled()) {
            return $this->errorResponse('Two-factor authentication is already enabled.', 422);
        }

        // Generate secret
        $secret = $this->generateTwoFactorSecret();
        
        // Generate recovery codes
        $recoveryCodes = $this->generateRecoveryCodes();

        // Store encrypted secret
        TwoFactorSecret::create([
            'user_id' => $user->id,
            'secret' => $secret,
            'recovery_codes' => $recoveryCodes,
            'is_enabled' => false,
        ]);

        // Generate QR code data
        $qrCodeUrl = $this->generateQrCodeUrl($user->email, $secret);
        
        try {
            Mail::to($user->email)->send(
                new TwoFactorSetupMail($user, $qrCodeUrl, $secret, $recoveryCodes)
            );
        } catch (\Exception $e) {
            \Log::error('Failed to send 2FA setup email: ' . $e->getMessage());
        }

        return $this->successResponse([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'recovery_codes' => $recoveryCodes,
        ], 'Two-factor authentication setup initiated. Please verify with a code from your authenticator app.');
    }

    /**
     * Verify and enable Two-Factor Authentication
     */
    public function verifyTwoFactor(Request $request): JsonResponse
    {
        $request->validate([
            'two_factor_code' => 'required|string|size:6',
        ]);

        $user = $request->user();
        $twoFactorSecret = $user->twoFactorSecret;

        if (!$twoFactorSecret) {
            return $this->errorResponse('Two-factor authentication setup not found.', 422);
        }

        if ($twoFactorSecret->is_enabled) {
            return $this->errorResponse('Two-factor authentication is already enabled.', 422);
        }

        if (!$this->verifyTwoFactorCode($user, $request->two_factor_code)) {
            return $this->errorResponse('Invalid two-factor authentication code.', 422);
        }

        $twoFactorSecret->update([
            'is_enabled' => true,
            'enabled_at' => now(),
        ]);

        return $this->successResponse(null, 'Two-factor authentication enabled successfully.');
    }

    /**
     * Disable Two-Factor Authentication
     */
    public function disableTwoFactor(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
            'two_factor_code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return $this->errorResponse('Invalid password.', 422);
        }

        if (!$user->hasTwoFactorEnabled()) {
            return $this->errorResponse('Two-factor authentication is not enabled.', 422);
        }

        if (!$this->verifyTwoFactorCode($user, $request->two_factor_code)) {
            return $this->errorResponse('Invalid two-factor authentication code.', 422);
        }

        $user->twoFactorSecret->delete();

        return $this->successResponse(null, 'Two-factor authentication disabled successfully.');
    }

    /**
     * Get new recovery codes for 2FA
     */
    public function regenerateRecoveryCodes(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return $this->errorResponse('Invalid password.', 422);
        }

        if (!$user->hasTwoFactorEnabled()) {
            return $this->errorResponse('Two-factor authentication is not enabled.', 422);
        }

        $recoveryCodes = $this->generateRecoveryCodes();
        $user->twoFactorSecret->update(['recovery_codes' => $recoveryCodes]);

        return $this->successResponse([
            'recovery_codes' => $recoveryCodes,
        ], 'Recovery codes regenerated successfully.');
    }

    /**
     * Setup 2FA during onboarding (post-activation, not yet logged in)
     */
    public function setupTwoFactorOnboarding(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $email = base64_decode($request->token, true);
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->errorResponse('Invalid token.', 422);
        }

        $user = User::where('email', $email)->where('is_active', true)->first();
        if (!$user) {
            return $this->errorResponse('User not found or account not activated.', 404);
        }

        if ($user->hasTwoFactorEnabled()) {
            return $this->successResponse([
                'already_setup' => true,
                'message' => 'Two-factor authentication is already enabled.',
            ], '2FA already enabled.');
        }

        $secret = $this->generateTwoFactorSecret();
        $recoveryCodes = $this->generateRecoveryCodes();

        TwoFactorSecret::where('user_id', $user->id)->forceDelete();

        TwoFactorSecret::create([
            'user_id' => $user->id,
            'secret' => $secret,
            'recovery_codes' => $recoveryCodes,
            'is_enabled' => false,
        ]);

        $qrCodeUrl = $this->generateQrCodeUrl($user->email, $secret);

        return $this->successResponse([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'recovery_codes' => $recoveryCodes,
        ], 'Scan the QR code with your authenticator app, then enter the 6-digit code to verify.');
    }

    /**
     * Verify and enable 2FA during onboarding
     */
    public function verifyTwoFactorOnboarding(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'two_factor_code' => 'required|string|size:6',
        ]);

        $email = base64_decode($request->token, true);
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->errorResponse('Invalid token.', 422);
        }

        $user = User::where('email', $email)->where('is_active', true)->first();
        if (!$user) {
            return $this->errorResponse('User not found or account not activated.', 404);
        }

        $twoFactorSecret = $user->twoFactorSecret;
        if (!$twoFactorSecret || $twoFactorSecret->is_enabled) {
            return $this->errorResponse('2FA setup not found or already enabled.', 422);
        }

        if (!$this->verifyTwoFactorCode($user, $request->two_factor_code)) {
            return $this->errorResponse('Invalid code. Please check your authenticator app and try again.', 422);
        }

        $twoFactorSecret->update([
            'is_enabled' => true,
            'enabled_at' => now(),
        ]);

        return $this->successResponse(null, 'Your two-factor authentication has been enabled successfully');
    }

    /**
     * Skip 2FA setup during onboarding
     */
    public function skipTwoFactorOnboarding(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $email = base64_decode($request->token, true);
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->errorResponse('Invalid token.', 422);
        }

        $user = User::where('email', $email)->where('is_active', true)->first();
        if (!$user) {
            return $this->errorResponse('User not found or account not activated.', 404);
        }

        // Clean up any pending 2FA setup
        TwoFactorSecret::where('user_id', $user->id)->where('is_enabled', false)->delete();

        return $this->successResponse(null, '2FA setup skipped. You can enable it later from your profile.');
    }

    /**
     * Login using recovery code
     */
    public function loginWithRecoveryCode(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'recovery_code' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            $this->logLoginAttempt($request, $user, 'failed', 'Invalid credentials');
            return $this->errorResponse('Invalid credentials.', 401);
        }

        if (!$user->is_active) {
            $this->logLoginAttempt($request, $user, 'failed', 'Account is deactivated');
            return $this->errorResponse('Your account has been deactivated.', 403);
        }

        if (!$user->isAdmin()) {
            $this->logLoginAttempt($request, $user, 'failed', 'Not an admin');
            return $this->errorResponse('Access denied. Only administrators can log in.', 403);
        }

        if (!$user->hasTwoFactorEnabled()) {
            return $this->errorResponse('Two-factor authentication is not enabled.', 422);
        }

        $recoveryCodes = $user->twoFactorSecret->getDecryptedRecoveryCodes();
        $recoveryCode = $request->recovery_code;

        if (!in_array($recoveryCode, $recoveryCodes)) {
            $this->logLoginAttempt($request, $user, 'failed', 'Invalid recovery code');
            return $this->errorResponse('Invalid recovery code.', 401);
        }

        // Remove used recovery code
        $updatedCodes = array_filter($recoveryCodes, fn($code) => $code !== $recoveryCode);
        $user->twoFactorSecret->update(['recovery_codes' => array_values($updatedCodes)]);

        return $this->loginUser($request, $user);
    }

    /**
     * Get active sessions for current user
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

        return $this->successResponse(array_values($sessions));
    }

    /**
     * Revoke specific session
     */
    public function revokeSession(Request $request, $tokenId): JsonResponse
    {
        $user = $request->user();
        $token = $user->tokens()->findOrFail($tokenId);
        
        if ((int) $token->id === (int) $request->user()->currentAccessToken()->id) {
            return $this->errorResponse('Cannot revoke current session.', 422);
        }

        $this->tokenState->blacklistToken($token->id);
        $this->tokenState->removeTokenMetadata($token->id);
        \App\Models\RefreshToken::where('access_token_id', $token->id)->update(['is_revoked' => true]);
        $token->delete();

        return $this->successResponse(null, 'Session revoked successfully.');
    }

    /**
     * Revoke all other sessions except current
     */
    public function revokeAllOtherSessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = (int) $request->user()->currentAccessToken()->id;
        
        $this->tokenState->removeAllUserTokens($user, $currentTokenId);
        $this->refreshService->revokeAllUserRefreshTokens($user->id);

        $revokedCount = $user->tokens()->where('id', '!=', $currentTokenId)->count();
        $user->tokens()->where('id', '!=', $currentTokenId)->delete();

        return $this->successResponse([
            'revoked_count' => $revokedCount,
        ], "Revoked {$revokedCount} sessions successfully.");
    }

    /**
     * Refresh access token using refresh token
     * Refresh token is rotated on each renewal to reduce token replay risk
     */
    public function refreshToken(Request $request): JsonResponse
    {
        $request->validate([
            'refresh_token' => 'required|string',
        ]);

        $result = $this->refreshService->refresh($request->refresh_token, $request);

        if (!$result) {
            return $this->errorResponse('Invalid or expired refresh token. Please log in again.', 401);
        }

        $accessToken = \Laravel\Sanctum\PersonalAccessToken::find($result['access_token_id']);
        if ($accessToken) {
            $this->tokenState->storeTokenMetadata($result['user'], $accessToken, $request);
        }

        return $this->successResponse([
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'expires_at' => $result['expires_at'],
            'user' => $result['user'],
        ], 'Token refreshed successfully.');
    }

    /**
     * Get session summary statistics for admins
     */
    public function sessionStats(): JsonResponse
    {
        return $this->successResponse(
            $this->tokenState->getSessionStats()
        );
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private function loginUser(Request $request, User $user): JsonResponse
    {
        $token = $user->createToken('auth-token', ['*'], now()->addHours(12));

        $this->tokenState->storeTokenMetadata($user, $token->accessToken, $request);

        $refreshToken = $this->refreshService->createRefreshToken($user, $token->accessToken, $request);

        $this->logLoginAttempt($request, $user, 'success', null);

        $user->recordLogin();

        return $this->successResponse([
            'user' => $user->load('roles'),
            'token' => $token->plainTextToken,
            'refresh_token' => $refreshToken->token,
            'expires_at' => $token->accessToken->expires_at,
            'refresh_expires_at' => $refreshToken->expires_at,
        ], 'Login successful.');
    }

    private function logLoginAttempt(Request $request, ?User $user, string $status, ?string $reason): void
    {
        $ip = $request->ip();
        $location = $this->getGeoLocation($ip);

        LoginActivity::create([
            'user_id' => $user?->id,
            'email' => $request->email,
            'ip_address' => $ip,
            'user_agent' => $request->userAgent(),
            'device_type' => $this->parseDeviceType($request->userAgent()),
            'browser' => $this->parseBrowser($request->userAgent()),
            'platform' => $this->parseOs($request->userAgent()),
            'location' => $location,
            'status' => $status,
            'failure_reason' => $reason,
            'login_at' => now(),
        ]);
    }

    private function getGeoLocation(string $ip): ?string
    {
        if ($ip === '127.0.0.1' || $ip === '::1') {
            return 'Local';
        }

        try {
            $response = Http::timeout(2)
                ->get("http://ip-api.com/json/{$ip}", ['fields' => 'status,country,regionName,city']);

            if ($response->successful() && $response->json('status') === 'success') {
                $parts = array_filter([
                    $response->json('city'),
                    $response->json('regionName'),
                    $response->json('country'),
                ]);
                return implode(', ', $parts) ?: null;
            }
        } catch (\Exception $e) {
            \Log::debug('Geolocation lookup failed for IP: ' . $ip);
        }

        return null;
    }

    private function generateTwoFactorSecret(): string
    {
        $google2fa = new Google2FA();
        return $google2fa->generateSecretKey(32);
    }

    private function generateRecoveryCodes(): array
    {
        $codes = [];
        for ($i = 0; $i < 10; $i++) {
            $codes[] = strtoupper(bin2hex(random_bytes(5)));
        }
        return $codes;
    }

    private function generateQrCodeUrl(string $email, string $secret): string
    {
        $appName = config('app.name', 'Ethio Nordic Trading PLC');
        $google2fa = new Google2FA();
        return $google2fa->getQRCodeUrl($appName, $email, $secret);
    }

    private function verifyTwoFactorCode(User $user, string $code): bool
    {
        if (!$user->twoFactorSecret) {
            return false;
        }

        $secret = $user->twoFactorSecret->getDecryptedSecret();
        $google2fa = new Google2FA();

        return $google2fa->verifyKey($secret, $code, 1);
    }

    private function parseDeviceType(?string $userAgent): string
    {
        if (!$userAgent) return 'Unknown';
        if (preg_match('/mobile|android|iphone/i', $userAgent)) return 'Mobile';
        if (preg_match('/tablet|ipad/i', $userAgent)) return 'Tablet';
        return 'Desktop';
    }

    private function parseBrowser(?string $userAgent): string
    {
        if (!$userAgent) return 'Unknown';
        if (preg_match('/chrome/i', $userAgent)) return 'Chrome';
        if (preg_match('/firefox/i', $userAgent)) return 'Firefox';
        if (preg_match('/safari/i', $userAgent)) return 'Safari';
        if (preg_match('/edge/i', $userAgent)) return 'Edge';
        return 'Other';
    }

    private function parseOs(?string $userAgent): string
    {
        if (!$userAgent) return 'Unknown';
        if (preg_match('/windows/i', $userAgent)) return 'Windows';
        if (preg_match('/macintosh|mac os/i', $userAgent)) return 'macOS';
        if (preg_match('/linux/i', $userAgent)) return 'Linux';
        if (preg_match('/android/i', $userAgent)) return 'Android';
        if (preg_match('/iphone|ipad/i', $userAgent)) return 'iOS';
        return 'Other';
    }
}
