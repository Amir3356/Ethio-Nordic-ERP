<?php

namespace App\Services;

use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class TokenRefreshService
{
    private const REFRESH_TOKEN_LENGTH = 128;
    private const REFRESH_TOKEN_EXPIRY_DAYS = 30;

    public function createRefreshToken(
        User $user,
        PersonalAccessToken $accessToken,
        Request $request
    ): RefreshToken {
        $refreshToken = Str::random(self::REFRESH_TOKEN_LENGTH);

        return RefreshToken::create([
            'user_id' => $user->id,
            'token' => Hash::make($refreshToken),
            'access_token_id' => $accessToken->getKey(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_type' => $this->parseDeviceType($request->userAgent()),
            'browser' => $this->parseBrowser($request->userAgent()),
            'platform' => $this->parseOs($request->userAgent()),
            'expires_at' => now()->addDays(self::REFRESH_TOKEN_EXPIRY_DAYS),
        ]);
    }

    public function refresh(
        string $refreshTokenPlain,
        Request $request
    ): ?array {
        $refreshTokens = RefreshToken::valid()->get();

        foreach ($refreshTokens as $refreshToken) {
            if (Hash::check($refreshTokenPlain, $refreshToken->token)) {
                if ($refreshToken->isExpired()) {
                    $refreshToken->revoke();
                    return null;
                }

                $user = $refreshToken->user;
                if (!$user || !$user->is_active) {
                    $refreshToken->revoke();
                    return null;
                }

                return $this->rotateRefreshToken($refreshToken, $user, $request);
            }
        }

        return null;
    }

    private function rotateRefreshToken(
        RefreshToken $oldRefreshToken,
        User $user,
        Request $request
    ): array {
        $oldRefreshToken->revoke();

        $oldAccessToken = PersonalAccessToken::find($oldRefreshToken->access_token_id);
        if ($oldAccessToken) {
            $oldAccessToken->delete();
        }

        $newAccessToken = $user->createToken('auth-token', ['*'], now()->addHours(12));

        $newRefreshToken = $this->createRefreshToken($user, $newAccessToken->accessToken, $request);

        return [
            'access_token' => $newAccessToken->plainTextToken,
            'access_token_id' => $newAccessToken->accessToken->getKey(),
            'refresh_token' => $newRefreshToken->token,
            'expires_at' => $newAccessToken->accessToken->expires_at,
            'user' => $user->load('roles'),
        ];
    }

    public function revokeRefreshToken(string $refreshTokenPlain): bool
    {
        $refreshTokens = RefreshToken::valid()->get();

        foreach ($refreshTokens as $refreshToken) {
            if (Hash::check($refreshTokenPlain, $refreshToken->token)) {
                $refreshToken->revoke();
                return true;
            }
        }

        return false;
    }

    public function revokeAllUserRefreshTokens(int $userId, ?int $exceptId = null): int
    {
        $query = RefreshToken::where('user_id', $userId)
            ->where('is_revoked', false);

        if ($exceptId) {
            $query->where('id', '!=', $exceptId);
        }

        return $query->update(['is_revoked' => true]);
    }

    public function getUserRefreshTokens(int $userId): array
    {
        return RefreshToken::where('user_id', $userId)
            ->valid()
            ->orderBy('last_used_at', 'desc')
            ->get()
            ->toArray();
    }

    public function cleanupExpiredTokens(): int
    {
        return RefreshToken::where('expires_at', '<', now())->delete();
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
