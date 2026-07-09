<?php

namespace App\Services\User;

use App\Mail\UserActivationMail;
use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class UserEmailService
{
    private const THROTTLE_MINUTES = 5;

    /**
     * Send activation email with throttling.
     */
    public function sendActivationEmail(User $user, string $tempPassword): bool
    {
        $throttleKey = 'activation_email:' . strtolower($user->email);

        if (Cache::has($throttleKey)) {
            Log::warning('Activation email throttled for: ' . $user->email);
            return false;
        }

        try {
            $activationUrl = config('app.frontend_url') . '/activate-account?token=' . base64_encode($user->email);

            Log::info('Sending activation email to: ' . $user->email);

            Mail::to($user->email)->send(
                new UserActivationMail($user, $tempPassword, $activationUrl)
            );

            Cache::put($throttleKey, true, now()->addMinutes(self::THROTTLE_MINUTES));
            Log::info('Activation email sent successfully to: ' . $user->email);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send activation email: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Resend activation email (generates new temp password).
     */
    public function resendActivationEmail(User $user): ?string
    {
        if ($user->email_verified_at) {
            return null;
        }

        $throttleKey = 'activation_email:' . strtolower($user->email);
        if (Cache::has($throttleKey)) {
            return null;
        }

        $tempPassword = $user->generateTemporaryPassword();

        $activationUrl = config('app.frontend_url') . '/activate-account?token=' . base64_encode($user->email);

        Mail::to($user->email)->send(
            new UserActivationMail($user, $tempPassword, $activationUrl)
        );

        Cache::put($throttleKey, true, now()->addMinutes(self::THROTTLE_MINUTES));

        return $tempPassword;
    }

    /**
     * Send password reset email.
     */
    public function sendPasswordResetEmail(User $user): ?string
    {
        $tempPassword = $user->generateTemporaryPassword();

        $resetUrl = config('app.frontend_url') . '/reset-password?token=' . base64_encode($user->email);

        Mail::to($user->email)->send(
            new PasswordResetMail($user, $resetUrl, $tempPassword)
        );

        return $tempPassword;
    }
}
