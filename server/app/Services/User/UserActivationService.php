<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserActivationService
{
    public function __construct(
        protected UserEmailService $emailService,
    ) {}

    /**
     * Activate a user account.
     */
    public function activate($id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->activate();

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User activated successfully.',
        ]);
    }

    /**
     * Deactivate a user account.
     */
    public function deactivate($id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->isAdmin()) {
            $adminCount = User::active()->whereHas('roles', fn($q) => $q->where('slug', 'admin'))->count();
            if ($adminCount <= 1) {
                return response()->json(['success' => false, 'message' => 'Cannot deactivate the last admin user.'], 422);
            }
        }

        if ($user->id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'You cannot deactivate your own account.'], 422);
        }

        $user->deactivate();

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User deactivated successfully.',
        ]);
    }

    /**
     * Resend activation email.
     */
    public function resendActivation($id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->email_verified_at) {
            return response()->json(['success' => false, 'message' => 'User email is already verified.'], 422);
        }

        $tempPassword = $this->emailService->resendActivationEmail($user);

        if ($tempPassword === null) {
            return response()->json(['success' => false, 'message' => 'Please wait before requesting another activation email.'], 429);
        }

        return response()->json([
            'success' => true,
            'data' => ['temp_password' => $tempPassword],
            'message' => 'Activation email sent successfully.',
        ]);
    }
}
