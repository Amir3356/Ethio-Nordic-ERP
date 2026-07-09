<?php

namespace App\Services\Auth;

use App\Models\User;

class RecoveryCodeService
{
    /**
     * Generate 10 recovery codes.
     */
    public function generate(): array
    {
        $codes = [];
        for ($i = 0; $i < 10; $i++) {
            $codes[] = strtoupper(bin2hex(random_bytes(5)));
        }
        return $codes;
    }

    /**
     * Validate a recovery code against a user's stored codes.
     */
    public function validate(User $user, string $code): bool
    {
        $recoveryCodes = $user->twoFactorSecret->getDecryptedRecoveryCodes();
        return in_array($code, $recoveryCodes);
    }

    /**
     * Remove a used recovery code and return updated codes.
     */
    public function removeUsed(User $user, string $code): array
    {
        $recoveryCodes = $user->twoFactorSecret->getDecryptedRecoveryCodes();
        $updatedCodes = array_filter($recoveryCodes, fn($c) => $c !== $code);
        $updatedCodes = array_values($updatedCodes);

        $user->twoFactorSecret->update(['recovery_codes' => $updatedCodes]);

        return $updatedCodes;
    }

    /**
     * Regenerate all recovery codes for a user.
     */
    public function regenerate(User $user): array
    {
        $newCodes = $this->generate();
        $user->twoFactorSecret->update(['recovery_codes' => $newCodes]);
        return $newCodes;
    }
}
