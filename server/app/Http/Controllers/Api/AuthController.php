<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Auth\AccountActivationService;
use App\Services\Auth\AuthenticationService;
use App\Services\Auth\PasswordService;
use App\Services\Auth\SessionService;
use App\Services\Auth\TwoFactorService;
use App\Services\Token\TokenRefreshService;
use App\Services\Token\TokenStateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthenticationService $auth,
        private readonly AccountActivationService $activation,
        private readonly TwoFactorService $twoFactor,
        private readonly PasswordService $password,
        private readonly SessionService $session,
        private readonly TokenStateService $tokenState,
        private readonly TokenRefreshService $refreshService,
    ) {}

    /**
     * Activate user account via email link.
     */
    public function activateAccount(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => ['required', Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
        ]);

        return $this->activation->activateAccount($request);
    }

    /**
     * Login with email and password.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'two_factor_code' => 'nullable|string|size:6',
        ]);

        return $this->auth->login($request);
    }

    /**
     * Register new user (admin only).
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

        return $this->auth->register($request);
    }

    /**
     * Logout user and invalidate current session.
     */
    public function logout(Request $request): JsonResponse
    {
        return $this->auth->logout($request);
    }

    /**
     * Get current user information.
     */
    public function me(Request $request): JsonResponse
    {
        return $this->auth->me($request);
    }

    /**
     * Change user password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
        ]);

        return $this->password->changePassword($request);
    }

    /**
     * Setup Two-Factor Authentication.
     */
    public function setupTwoFactor(Request $request): JsonResponse
    {
        return $this->twoFactor->setupTwoFactor($request);
    }

    /**
     * Verify and enable Two-Factor Authentication.
     */
    public function verifyTwoFactor(Request $request): JsonResponse
    {
        $request->validate([
            'two_factor_code' => 'required|string|size:6',
        ]);

        return $this->twoFactor->verifyTwoFactor($request);
    }

    /**
     * Disable Two-Factor Authentication.
     */
    public function disableTwoFactor(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
            'two_factor_code' => 'required|string|size:6',
        ]);

        return $this->twoFactor->disableTwoFactor($request);
    }

    /**
     * Get new recovery codes.
     */
    public function regenerateRecoveryCodes(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        return $this->password->regenerateRecoveryCodes($request);
    }

    /**
     * Setup 2FA during onboarding (post-activation, not yet logged in).
     */
    public function setupTwoFactorOnboarding(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        return $this->twoFactor->setupTwoFactorOnboarding($request);
    }

    /**
     * Verify and enable 2FA during onboarding.
     */
    public function verifyTwoFactorOnboarding(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'two_factor_code' => 'required|string|size:6',
        ]);

        return $this->twoFactor->verifyTwoFactorOnboarding($request);
    }

    /**
     * Skip 2FA setup during onboarding.
     */
    public function skipTwoFactorOnboarding(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        return $this->twoFactor->skipTwoFactorOnboarding($request);
    }

    /**
     * Login using recovery code.
     */
    public function loginWithRecoveryCode(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'recovery_code' => 'required|string',
        ]);

        return $this->auth->loginWithRecoveryCode($request);
    }

    /**
     * Get active sessions for current user.
     */
    public function activeSessions(Request $request): JsonResponse
    {
        return $this->session->activeSessions($request);
    }

    /**
     * Revoke specific session.
     */
    public function revokeSession(Request $request, $tokenId): JsonResponse
    {
        return $this->session->revokeSession($request, $tokenId);
    }

    /**
     * Revoke all other sessions except current.
     */
    public function revokeAllOtherSessions(Request $request): JsonResponse
    {
        return $this->session->revokeAllOtherSessions($request);
    }

    /**
     * Refresh access token using refresh token.
     */
    public function refreshToken(Request $request): JsonResponse
    {
        $request->validate([
            'refresh_token' => 'required|string',
        ]);

        return $this->auth->refreshToken($request);
    }

    /**
     * Get session summary statistics for admins.
     */
    public function sessionStats(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->tokenState->getSessionStats()]);
    }
}
