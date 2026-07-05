<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ActivationEmail;
use App\Models\LoginActivity;
use App\Models\TwoFactorSecret;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
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

        if ($user->two_factor_enabled) {
            $challenge = Str::random(32);
            cache()->put("2fa_challenge:{$challenge}", $user->id, 300);

            return $this->successResponse([
                'requires_2fa' => true,
                'challenge' => $challenge,
                'email' => $user->email,
            ], 'Two-factor authentication required.');
        }

        return $this->loginUser($request, $user);
    }

    public function verifyTwoFactor(Request $request): JsonResponse
    {
        $request->validate([
            'challenge' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        $userId = cache()->pull("2fa_challenge:{$request->challenge}");

        if (!$userId) {
            return $this->errorResponse('Invalid or expired challenge.', 401);
        }

        $user = User::findOrFail($userId);
        $twoFactorSecret = $user->twoFactorSecret;

        if (!$twoFactorSecret || !$twoFactorSecret->enabled) {
            return $this->errorResponse('Two-factor authentication is not enabled.', 400);
        }

        if (!$this->verifyTotpCode($twoFactorSecret->secret, $request->code)) {
            $this->logLoginAttempt($request, $user, 'failed', 'Invalid 2FA code');
            return $this->errorResponse('Invalid verification code.', 401);
        }

        return $this->loginUser($request, $user);
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'department' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $tempPassword = strtoupper(bin2hex(random_bytes(4)));

        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'department' => $request->department,
            'phone' => $request->phone,
            'password' => $tempPassword,
            'is_active' => false,
            'temp_password_expires_at' => now()->addHours(24),
        ]);

        $user->roles()->sync($request->role_ids);

        $activationToken = $user->generateActivationToken();

        try {
            Mail::to($user->email)->send(new ActivationEmail($user, $activationToken));
        } catch (\Exception $e) {
            \Log::error('Failed to send activation email: ' . $e->getMessage());
        }

        return $this->successResponse([
            'user' => $user->load('roles'),
            'temp_password' => $tempPassword,
        ], 'User registered successfully. Activation email sent.', 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            LoginActivity::where('user_id', $user->id)
                ->whereNull('logout_at')
                ->update(['logout_at' => now()]);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->successResponse(null, 'Logged out successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles.permissions']);

        return $this->successResponse($user);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->errorResponse('Current password is incorrect.', 422);
        }

        $user->update([
            'password' => $request->password,
            'temp_password_expires_at' => null,
        ]);

        return $this->successResponse(null, 'Password changed successfully.');
    }

    public function activateAccount(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('temp_password_expires_at', '>', now())
            ->where('is_active', false)
            ->first();

        if (!$user) {
            return $this->errorResponse('Invalid or expired activation token.', 422);
        }

        $user->update([
            'is_active' => true,
            'password' => $request->password,
            'temp_password_expires_at' => null,
            'email_verified_at' => now(),
        ]);

        return $this->successResponse(null, 'Account activated successfully.');
    }

    public function enable2FA(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->two_factor_enabled) {
            return $this->errorResponse('Two-factor authentication is already enabled.', 422);
        }

        $secret = $this->generateTotpSecret();
        $recoveryCodes = $this->generateRecoveryCodes();

        $user->twoFactorSecret()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'secret' => $secret,
                'recovery_codes' => $recoveryCodes,
                'enabled' => false,
            ]
        );

        $qrCodeUrl = $this->getTotpQrUrl($user->email, $secret);

        return $this->successResponse([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'recovery_codes' => $recoveryCodes,
        ], 'Scan the QR code with your authenticator app, then verify with verify-2fa endpoint.');
    }

    public function disable2FA(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        if (!$user->two_factor_enabled) {
            return $this->errorResponse('Two-factor authentication is not enabled.', 422);
        }

        $twoFactorSecret = $user->twoFactorSecret;

        if (!$this->verifyTotpCode($twoFactorSecret->secret, $request->code)) {
            return $this->errorResponse('Invalid verification code.', 422);
        }

        $user->twoFactorSecret()->delete();
        $user->update(['two_factor_enabled' => false]);

        return $this->successResponse(null, 'Two-factor authentication disabled successfully.');
    }

    private function loginUser(Request $request, User $user): JsonResponse
    {
        Auth::login($user);

        $request->session()->regenerate();

        LoginActivity::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_name' => $request->header('User-Agent', 'Unknown'),
            'device_type' => $this->parseDeviceType($request->userAgent()),
            'browser' => $this->parseBrowser($request->userAgent()),
            'os' => $this->parseOs($request->userAgent()),
            'status' => 'success',
            'login_at' => now(),
            'is_active' => true,
        ]);

        $user->update(['last_login_at' => now()]);

        return $this->successResponse([
            'user' => $user->load('roles'),
        ], 'Login successful.');
    }

    private function logLoginAttempt(Request $request, ?User $user, string $status, string $reason): void
    {
        LoginActivity::create([
            'user_id' => $user?->id,
            'email' => $request->email,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_name' => $request->header('User-Agent', 'Unknown'),
            'device_type' => $this->parseDeviceType($request->userAgent()),
            'browser' => $this->parseBrowser($request->userAgent()),
            'os' => $this->parseOs($request->userAgent()),
            'status' => $status,
            'failure_reason' => $reason,
            'login_at' => now(),
            'is_active' => false,
        ]);
    }

    private function generateTotpSecret(int $length = 20): string
    {
        return strtoupper(bin2hex(random_bytes($length)));
    }

    private function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(bin2hex(random_bytes(4)));
        }
        return $codes;
    }

    private function getTotpQrUrl(string $email, string $secret): string
    {
        $issuer = urlencode('EthioNordicERP');
        $label = urlencode($email);
        return "otpauth://totp/{$issuer}:{$label}?secret={$secret}&issuer={$issuer}&algorithm=SHA1&digits=6&period=30";
    }

    private function generateTotpCode(string $secret, int $timeSlice = null): string
    {
        if ($timeSlice === null) {
            $timeSlice = floor(time() / 30);
        }

        $time = chr(0) . chr(0) . chr(0) . chr(0) . pack('N*', $timeSlice);
        $hmac = hash_hmac('sha1', $time, $secret, true);

        $offset = ord(substr($hmac, -1)) & 0x0F;
        $hashPart = substr($hmac, $offset, 4);

        $value = unpack('N', $hashPart)[1];
        $value = $value & 0x7FFFFFFF;

        $code = $value % 1000000;
        return str_pad((string) $code, 6, '0', STR_PAD_LEFT);
    }

    private function verifyTotpCode(string $secret, string $code, int $tolerance = 1): bool
    {
        $currentTimeSlice = floor(time() / 30);

        for ($i = -$tolerance; $i <= $tolerance; $i++) {
            $calculatedCode = $this->generateTotpCode($secret, $currentTimeSlice + $i);
            if (hash_equals($calculatedCode, $code)) {
                return true;
            }
        }

        return false;
    }

    private function parseDeviceType(?string $userAgent): string
    {
        if (!$userAgent) return 'Unknown';
        if (preg_match('/mobile|android|iphone|ipad/i', $userAgent)) return 'Mobile';
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
