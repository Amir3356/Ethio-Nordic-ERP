<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ActivationEmail;
use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

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

        return $this->loginUser($request, $user);
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'department' => 'required|string|max:255',
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $tempPassword = strtoupper(bin2hex(random_bytes(4)));

        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'department' => $request->department,
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

        try {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        } catch (\Exception $e) {
            // Session may not exist for token-based auth
        }

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
