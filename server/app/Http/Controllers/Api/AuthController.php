<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\TwoFactorSetupMail;
use App\Models\LoginActivity;
use App\Models\TwoFactorSecret;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Activate user account via email link
     * User sets their permanent password and account becomes active
     */
    public function activateAccount(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(8)
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
     * Login with email and password, handle 2FA if enabled
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'two_factor_code' => 'nullable|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            $this->logLoginAttempt($request, $user, 'failed', 'Invalid credentials');
            return $this->errorResponse('Invalid credentials.', 401);
        }

        if (!$user->is_active) {
            $this->logLoginAttempt($request, $user, 'failed', 'Account is deactivated');
            return $this->errorResponse('Your account has been deactivated. Please contact administrator.', 403);
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
     * Logout user and invalidate token
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            // Update login activity
            LoginActivity::where('user_id', $user->id)
                ->whereNull('logout_at')
                ->latest()
                ->first()
                ?->update(['logout_at' => now()]);

            // Revoke current token
            $request->user()->currentAccessToken()?->delete();
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

        // Revoke all other tokens for security
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
        
        $sessions = $user->tokens()->where('expires_at', '>', now())->get()->map(function($token) {
            return [
                'id' => $token->id,
                'name' => $token->name,
                'last_used_at' => $token->last_used_at,
                'created_at' => $token->created_at,
                'is_current' => $token->id === request()->user()->currentAccessToken()->id,
            ];
        });

        return $this->successResponse($sessions);
    }

    /**
     * Revoke specific session
     */
    public function revokeSession(Request $request, $tokenId): JsonResponse
    {
        $user = $request->user();
        $token = $user->tokens()->findOrFail($tokenId);
        
        if ($token->id === $request->user()->currentAccessToken()->id) {
            return $this->errorResponse('Cannot revoke current session.', 422);
        }

        $token->delete();

        return $this->successResponse(null, 'Session revoked successfully.');
    }

    /**
     * Revoke all other sessions except current
     */
    public function revokeAllOtherSessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $request->user()->currentAccessToken()->id;
        
        $revokedCount = $user->tokens()->where('id', '!=', $currentTokenId)->count();
        $user->tokens()->where('id', '!=', $currentTokenId)->delete();

        return $this->successResponse([
            'revoked_count' => $revokedCount,
        ], "Revoked {$revokedCount} sessions successfully.");
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private function loginUser(Request $request, User $user): JsonResponse
    {
        // Create access token
        $token = $user->createToken('auth-token', ['*'], now()->addHours(12));

        // Log successful login
        $this->logLoginAttempt($request, $user, 'success', null);

        // Update last login
        $user->recordLogin();

        return $this->successResponse([
            'user' => $user->load('roles'),
            'token' => $token->plainTextToken,
            'expires_at' => $token->accessToken->expires_at,
        ], 'Login successful.');
    }

    private function logLoginAttempt(Request $request, ?User $user, string $status, ?string $reason): void
    {
        LoginActivity::create([
            'user_id' => $user?->id,
            'email' => $request->email,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_type' => $this->parseDeviceType($request->userAgent()),
            'browser' => $this->parseBrowser($request->userAgent()),
            'platform' => $this->parseOs($request->userAgent()),
            'status' => $status,
            'failure_reason' => $reason,
            'login_at' => now(),
        ]);
    }

    private function generateTwoFactorSecret(): string
    {
        // Generate base32 secret (160 bits = 32 characters)
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < 32; $i++) {
            $secret .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $secret;
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
        $appName = urlencode(config('app.name', 'ERP System'));
        $email = urlencode($email);
        return "otpauth://totp/{$appName}:{$email}?secret={$secret}&issuer={$appName}";
    }

    private function verifyTwoFactorCode(User $user, string $code): bool
    {
        if (!$user->twoFactorSecret) {
            return false;
        }

        $secret = $user->twoFactorSecret->getDecryptedSecret();
        $timeSlice = floor(time() / 30);
        
        // Check current time slice and ±1 slice for clock drift tolerance
        for ($i = -1; $i <= 1; $i++) {
            if ($this->generateTOTP($secret, $timeSlice + $i) === $code) {
                return true;
            }
        }

        return false;
    }

    private function generateTOTP(string $secret, int $timeSlice): string
    {
        // Simple TOTP implementation
        $key = $this->base32Decode($secret);
        $time = pack('N*', 0) . pack('N*', $timeSlice);
        $hash = hash_hmac('sha1', $time, $key, true);
        $offset = ord($hash[19]) & 0xf;
        $code = (
            ((ord($hash[$offset + 0]) & 0x7f) << 24) |
            ((ord($hash[$offset + 1]) & 0xff) << 16) |
            ((ord($hash[$offset + 2]) & 0xff) << 8) |
            (ord($hash[$offset + 3]) & 0xff)
        ) % 1000000;
        return str_pad($code, 6, '0', STR_PAD_LEFT);
    }

    private function base32Decode(string $data): string
    {
        $map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $data = strtoupper($data);
        $l = strlen($data);
        $n = 0;
        $j = 0;
        $binary = '';

        for ($i = 0; $i < $l; $i++) {
            $n = $n << 5;
            $n = $n + strpos($map, $data[$i]);
            $j = $j + 5;
            if ($j >= 8) {
                $j = $j - 8;
                $binary .= chr(($n & (0xFF << $j)) >> $j);
            }
        }
        return $binary;
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
