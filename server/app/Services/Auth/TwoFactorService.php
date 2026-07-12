<?php

namespace App\Services\Auth;

use App\Models\TwoFactorSecret;
use App\Models\User;
use App\Mail\TwoFactorSetupMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\Auth\AuthenticationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorService
{
    public function __construct(
        protected AccountActivationService $activation,
    ) {}

    /**
     * Setup Two-Factor Authentication.
     */
    public function setupTwoFactor(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasTwoFactorEnabled()) {
            return response()->json(['success' => false, 'message' => 'Two-factor authentication is already enabled.'], 422);
        }

        $setupData = $this->provideSetupData($user);

        TwoFactorSecret::updateOrCreate(
            ['user_id' => $user->id],
            [
                'secret' => $setupData['secret'],
                'recovery_codes' => $setupData['recovery_codes'],
                'is_enabled' => false,
            ]
        );

        $this->sendSetupEmail(
            $user,
            $setupData['qr_code_url'],
            $setupData['secret'],
            $setupData['recovery_codes']
        );

        return response()->json([
            'success' => true,
            'data' => [
                'secret' => $setupData['secret'],
                'qr_code_url' => $setupData['qr_code_url'],
                'recovery_codes' => $setupData['recovery_codes'],
            ],
            'message' => 'Two-factor authentication setup initiated. Please verify with a code from your authenticator app.',
        ]);
    }

    /**
     * Verify and enable Two-Factor Authentication.
     */
    public function verifyTwoFactor(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->twoFactorSecret || $user->twoFactorSecret->is_enabled) {
            return response()->json(['success' => false, 'message' => 'Two-factor authentication setup not found or already enabled.'], 422);
        }

        if (!$this->verify($user, $request->two_factor_code)) {
            return response()->json(['success' => false, 'message' => 'Invalid two-factor authentication code.'], 422);
        }

        $this->enable($user);

        return response()->json(['success' => true, 'message' => 'Two-factor authentication enabled successfully.']);
    }

    /**
     * Disable Two-Factor Authentication.
     */
    public function disableTwoFactor(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!app(PasswordService::class)->verify($user, $request->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid password.'], 422);
        }

        if (!$user->hasTwoFactorEnabled()) {
            return response()->json(['success' => false, 'message' => 'Two-factor authentication is not enabled.'], 422);
        }

        if (!$this->verify($user, $request->two_factor_code)) {
            return response()->json(['success' => false, 'message' => 'Invalid two-factor authentication code.'], 422);
        }

        $this->disable($user);

        return response()->json(['success' => true, 'message' => 'Two-factor authentication disabled successfully.']);
    }

    /**
     * Setup 2FA during onboarding (post-activation, not yet logged in).
     */
    public function setupTwoFactorOnboarding(Request $request): JsonResponse
    {
        $email = $this->activation->decodeEmailFromToken($request->token);

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['success' => false, 'message' => 'Invalid token.'], 422);
        }

        $user = User::where('email', $email)->where('is_active', true)->first();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found or account not activated.'], 404);
        }

        if ($user->hasTwoFactorEnabled()) {
            return response()->json([
                'success' => true,
                'data' => ['already_setup' => true, 'message' => 'Two-factor authentication is already enabled.'],
                'message' => '2FA already enabled.',
            ]);
        }

        // Attribute the audited 2FA secret creation to the onboarding user.
        Auth::setUser($user);

        $setupData = $this->provideSetupData($user);

        return response()->json([
            'success' => true,
            'data' => $setupData,
            'message' => 'Scan the QR code with your authenticator app, then enter the 6-digit code to verify.',
        ]);
    }

    /**
     * Verify and enable 2FA during onboarding.
     */
    public function verifyTwoFactorOnboarding(Request $request): JsonResponse
    {
        $email = $this->activation->decodeEmailFromToken($request->token);

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['success' => false, 'message' => 'Invalid token.'], 422);
        }

        $user = User::where('email', $email)->where('is_active', true)->first();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found or account not activated.'], 404);
        }

        if (!$user->twoFactorSecret || $user->twoFactorSecret->is_enabled) {
            return response()->json(['success' => false, 'message' => '2FA setup not found or already enabled.'], 422);
        }

        if (!$this->verify($user, $request->two_factor_code)) {
            return response()->json(['success' => false, 'message' => 'Invalid code. Please check your authenticator app and try again.'], 422);
        }

        // 2FA code is verified — attribute the audited writes (2FA enable,
        // tokens, last_login_at) to the onboarding user.
        Auth::setUser($user);

        $this->enable($user);

        return response()->json([
            'success' => true,
            'data' => app(AuthenticationService::class)->completeLogin($user, $request),
            'message' => 'Login successful.',
        ]);
    }

    /**
     * Skip 2FA setup during onboarding.
     */
    public function skipTwoFactorOnboarding(Request $request): JsonResponse
    {
        $email = $this->activation->decodeEmailFromToken($request->token);

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['success' => false, 'message' => 'Invalid token.'], 422);
        }

        $user = User::where('email', $email)->where('is_active', true)->first();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found or account not activated.'], 404);
        }

        // Attribute the audited 2FA secret removal to the onboarding user.
        Auth::setUser($user);

        TwoFactorSecret::where('user_id', $user->id)->where('is_enabled', false)->delete();

        return response()->json(['success' => true, 'message' => '2FA setup skipped. You can enable it later from your profile.']);
    }

    /**
     * Verify a 2FA code against a user's secret.
     */
    public function verify(User $user, string $code): bool
    {
        if (!$user->twoFactorSecret) {
            \Log::error('2FA verify: no twoFactorSecret for user ' . $user->id);
            return false;
        }

        try {
            $secret = $user->twoFactorSecret->getDecryptedSecret();
        } catch (\Throwable $e) {
            \Log::error('2FA verify: failed to decrypt secret for user ' . $user->id . ': ' . $e->getMessage());
            return false;
        }

        if (strlen($secret) < 8) {
            \Log::error('2FA verify: decrypted secret too short for user ' . $user->id . ' (len=' . strlen($secret) . ')');
            return false;
        }

        $google2fa = new Google2FA();

        try {
            $result = $google2fa->verifyKey($secret, $code, 56);
        } catch (\Throwable $e) {
            \Log::error('2FA verify: verifyKey failed for user ' . $user->id . ': ' . $e->getMessage());
            return false;
        }

        \Log::info('2FA verify', [
            'user_id' => $user->id,
            'input_code' => $code,
            'result' => $result,
        ]);

        return $result;
    }

    /**
     * Enable 2FA for a user after successful code verification.
     */
    public function enable(User $user): void
    {
        $user->twoFactorSecret->update([
            'is_enabled' => true,
            'enabled_at' => now(),
        ]);
    }

    /**
     * Disable 2FA for a user.
     */
    public function disable(User $user): void
    {
        $user->twoFactorSecret->delete();
    }

    /**
     * Generate a new 2FA secret.
     */
    public function generateSecret(): string
    {
        $google2fa = new Google2FA();
        return $google2fa->generateSecretKey(32);
    }

    /**
     * Generate QR code URL for authenticator apps.
     */
    public function generateQrCodeUrl(string $email, string $secret): string
    {
        $appName = config('app.name', 'Ethio Nordic Trading PLC');
        $google2fa = new Google2FA();
        return $google2fa->getQRCodeUrl($appName, $email, $secret);
    }

    /**
     * Provide 2FA setup data (secret, QR URL, recovery codes).
     */
    public function provideSetupData(User $user): array
    {
        $twoFactorSecret = TwoFactorSecret::where('user_id', $user->id)->first();

        if ($twoFactorSecret) {
            $secret = $twoFactorSecret->getDecryptedSecret();
            $recoveryCodes = $twoFactorSecret->getDecryptedRecoveryCodes();
        } else {
            $secret = $this->generateSecret();
            $recoveryCodes = app(RecoveryCodeService::class)->generate();

            try {
                TwoFactorSecret::create([
                    'user_id' => $user->id,
                    'secret' => $secret,
                    'recovery_codes' => json_encode($recoveryCodes),
                    'is_enabled' => false,
                ]);
            } catch (\Illuminate\Database\QueryException $e) {
                $twoFactorSecret = TwoFactorSecret::where('user_id', $user->id)->first();
                if ($twoFactorSecret) {
                    $secret = $twoFactorSecret->getDecryptedSecret();
                    $recoveryCodes = $twoFactorSecret->getDecryptedRecoveryCodes();
                }
            }
        }

        $qrCodeUrl = $this->generateQrCodeUrl($user->email, $secret);

        return [
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'recovery_codes' => $recoveryCodes,
        ];
    }

    /**
     * Send 2FA setup email to user.
     */
    public function sendSetupEmail(User $user, string $qrCodeUrl, string $secret, array $recoveryCodes): void
    {
        try {
            Mail::to($user->email)->send(
                new TwoFactorSetupMail($user, $qrCodeUrl, $secret, $recoveryCodes)
            );
        } catch (\Exception $e) {
            \Log::error('Failed to send 2FA setup email: ' . $e->getMessage());
        }
    }
}
