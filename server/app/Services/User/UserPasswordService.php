<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserPasswordService
{
    public function __construct(
        protected UserEmailService $emailService,
    ) {}

    /**
     * Reset user password and send email.
     */
    public function resetPassword($id): JsonResponse
    {
        $user = User::findOrFail($id);

        $tempPassword = $this->emailService->sendPasswordResetEmail($user);

        return response()->json([
            'success' => true,
            'data' => ['temp_password' => $tempPassword],
            'message' => 'Password reset email sent successfully.',
        ]);
    }
}
