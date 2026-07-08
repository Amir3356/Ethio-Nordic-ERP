<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;
use Laravel\Sanctum\PersonalAccessToken;

class TokenStateService
{
    private const TOKEN_META_KEY = 'token:%s:metadata';
    private const USER_TOKENS_KEY = 'user:%s:tokens';
    private const BLACKLIST_KEY = 'token:blacklist';

    private function redis(): \Illuminate\Redis\Connections\Connection
    {
        return Redis::connection('token_state');
    }

    public function storeTokenMetadata(User $user, PersonalAccessToken $token, Request $request): void
    {
        $metaKey = $this->metaKey($token->getKey());
        $ip = $request->ip();
        $location = $this->getGeoLocation($ip);

        $deviceType = $this->parseDeviceType($request->userAgent());
        $browser = $this->parseBrowser($request->userAgent());
        $platform = $this->parseOs($request->userAgent());

        $this->redis()->hmset($metaKey, [
            'user_id' => $user->id,
            'user_name' => $user->full_name,
            'user_email' => $user->email,
            'token_name' => $token->name,
            'abilities' => json_encode($token->abilities ?? ['*']),
            'ip_address' => $ip,
            'user_agent' => $request->userAgent(),
            'device_type' => $deviceType,
            'browser' => $browser,
            'platform' => $platform,
            'location' => $location,
            'created_at' => $token->created_at?->toIso8601String() ?? now()->toIso8601String(),
            'expires_at' => $token->expires_at?->toIso8601String(),
            'last_used_at' => now()->toIso8601String(),
            'last_activity_at' => now()->toIso8601String(),
        ]);

        // Persist device info to the database so it survives Redis expiry
        PersonalAccessToken::where('id', $token->getKey())->update([
            'ip_address' => $ip,
            'user_agent' => $request->userAgent(),
            'device_type' => $deviceType,
            'browser' => $browser,
            'platform' => $platform,
            'location' => $location,
        ]);

        $ttl = $token->expires_at ? $token->expires_at->diffInSeconds(now()) : 86400;
        if ($ttl > 0) {
            $this->redis()->expire($metaKey, (int) $ttl);
        }

        $this->redis()->sadd($this->userTokensKey($user->id), $token->getKey());
        $this->redis()->expire($this->userTokensKey($user->id), (int) max($ttl, 86400));
    }

    public function removeTokenMetadata(int|string $tokenId): void
    {
        $token = PersonalAccessToken::find($tokenId);
        if ($token) {
            $this->redis()->srem($this->userTokensKey($token->tokenable_id), $tokenId);
        }
        $this->redis()->del($this->metaKey($tokenId));
    }

    public function removeAllUserTokens(User $user, ?int $exceptTokenId = null): int
    {
        $tokenIds = $this->redis()->smembers($this->userTokensKey($user->id));
        $removed = 0;

        foreach ($tokenIds as $tokenId) {
            if ($exceptTokenId !== null && (int) $tokenId === $exceptTokenId) {
                continue;
            }
            $this->redis()->del($this->metaKey($tokenId));
            $this->redis()->sadd(self::BLACKLIST_KEY, $tokenId);
            $removed++;
        }

        $this->redis()->del($this->userTokensKey($user->id));

        if ($exceptTokenId !== null) {
            $this->storeCurrentTokenInSet($user, $exceptTokenId);
        }

        return $removed;
    }

    public function getActiveSessions(User $user): array
    {
        $tokenIds = $this->redis()->smembers($this->userTokensKey($user->id));
        $sessions = [];

        foreach ($tokenIds as $tokenId) {
            $meta = $this->redis()->hgetall($this->metaKey($tokenId));
            if (!empty($meta)) {
                $meta['id'] = $tokenId;
                $sessions[] = $meta;
            }
        }

        if (empty($sessions)) {
            $sessions = $this->loadSessionsFromDatabase($user);
        }

        return $sessions;
    }

    /**
     * Get all active sessions system-wide for admin view.
     * Returns enriched data with fullname, email, device, and location metadata.
     */
    public function getAllSessions(?string $search = null, ?int $userId = null): array
    {
        if ($userId) {
            return $this->getActiveSessions(User::find($userId));
        }

        $iterator = null;
        $pattern = str_replace('%s', '*', self::TOKEN_META_KEY);
        $sessions = [];

        do {
            $result = $this->redis()->scan($iterator, ['match' => $pattern, 'count' => 100]);
            if ($result === false) {
                break;
            }
            [$iterator, $keys] = $result;
            foreach ($keys as $key) {
                $meta = $this->redis()->hgetall($key);
                if (!empty($meta)) {
                    preg_match('/token:(\d+):metadata/', $key, $matches);
                    $meta['id'] = $matches[1] ?? null;

                    // Enrich with location if missing
                    if (empty($meta['location']) && !empty($meta['ip_address'])) {
                        $meta['location'] = $this->getGeoLocation($meta['ip_address']);
                        if ($meta['location']) {
                            $this->redis()->hset($key, 'location', $meta['location']);
                        }
                    }

                    if ($search) {
                        $searchLower = strtolower($search);
                        $match = str_contains(strtolower($meta['user_name'] ?? ''), $searchLower)
                            || str_contains(strtolower($meta['user_email'] ?? ''), $searchLower);
                        if (!$match) continue;
                    }
                    $sessions[] = $meta;
                }
            }
        } while ($iterator > 0);

        if (empty($sessions)) {
            $sessions = $this->loadAllSessionsFromDatabase($search);
        }

        usort($sessions, fn($a, $b) => strcmp($b['last_used_at'] ?? '', $a['last_used_at'] ?? ''));

        return $sessions;
    }

    public function isBlacklisted(int|string $tokenId): bool
    {
        return (bool) $this->redis()->sismember(self::BLACKLIST_KEY, $tokenId);
    }

    public function blacklistToken(int|string $tokenId, ?int $ttl = 86400): void
    {
        $this->redis()->sadd(self::BLACKLIST_KEY, $tokenId);
        if ($ttl) {
            $this->redis()->expire(self::BLACKLIST_KEY, $ttl);
        }
    }

    public function updateLastUsed(int|string $tokenId): void
    {
        $key = $this->metaKey($tokenId);
        if ($this->redis()->exists($key)) {
            $this->redis()->hset($key, 'last_used_at', now()->toIso8601String());
        }
    }

    public function updateLastActivity(int|string $tokenId): void
    {
        $key = $this->metaKey($tokenId);
        if ($this->redis()->exists($key)) {
            $this->redis()->hset($key, 'last_activity_at', now()->toIso8601String());
        }
    }

    public function getLastActivity(int|string $tokenId): ?string
    {
        $key = $this->metaKey($tokenId);
        return $this->redis()->hget($key, 'last_activity_at') ?: null;
    }

    public function updateSessionLocation(int|string $tokenId, ?string $location): void
    {
        $key = $this->metaKey($tokenId);
        if ($this->redis()->exists($key) && $location) {
            $this->redis()->hset($key, 'location', $location);
        }
    }

    /**
     * Get session summary statistics for admins.
     */
    public function getSessionStats(): array
    {
        $allSessions = $this->getAllSessions();
        $total = count($allSessions);

        $byDevice = ['Desktop' => 0, 'Mobile' => 0, 'Tablet' => 0, 'Unknown' => 0];
        $byBrowser = [];
        $byPlatform = [];
        $byLocation = [];

        foreach ($allSessions as $session) {
            $device = $session['device_type'] ?? 'Unknown';
            $byDevice[$device] = ($byDevice[$device] ?? 0) + 1;

            $browser = $session['browser'] ?? 'Unknown';
            $byBrowser[$browser] = ($byBrowser[$browser] ?? 0) + 1;

            $platform = $session['platform'] ?? 'Unknown';
            $byPlatform[$platform] = ($byPlatform[$platform] ?? 0) + 1;

            $location = $session['location'] ?? 'Unknown';
            $byLocation[$location] = ($byLocation[$location] ?? 0) + 1;
        }

        return [
            'total_sessions' => $total,
            'by_device' => $byDevice,
            'by_browser' => $byBrowser,
            'by_platform' => $byPlatform,
            'by_location' => $byLocation,
        ];
    }

    /**
     * Revoke a specific session by token ID (admin force terminate).
     * Blacklists the token, removes metadata, and revokes associated refresh token.
     */
    public function forceTerminateSession(int|string $tokenId): bool
    {
        $token = PersonalAccessToken::find($tokenId);
        if (!$token) {
            return false;
        }

        // Blacklist the access token
        $this->blacklistToken($tokenId);

        // Remove Redis metadata
        $this->removeTokenMetadata($tokenId);

        // Revoke associated refresh token
        \App\Models\RefreshToken::where('access_token_id', $tokenId)
            ->update(['is_revoked' => true]);

        // Delete the access token
        $token->delete();

        return true;
    }

    /**
     * Force terminate ALL sessions for a user (admin action for compromised/terminated employees).
     */
    public function forceTerminateAllUserSessions(int $userId): int
    {
        $user = User::find($userId);
        if (!$user) {
            return 0;
        }

        $removed = $this->removeAllUserTokens($user);

        // Revoke all refresh tokens
        \App\Models\RefreshToken::where('user_id', $userId)
            ->where('is_revoked', false)
            ->update(['is_revoked' => true]);

        // Delete all access tokens
        $user->tokens()->delete();

        return $removed;
    }

    /**
     * Get geolocation from IP address using ip-api.com
     */
    private function getGeoLocation(string $ip): ?string
    {
        if ($ip === '127.0.0.1' || $ip === '::1' || $ip === 'localhost') {
            return 'Local';
        }

        // Handle private/internal IPs (Docker, LAN, etc.)
        if (preg_match('/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/', $ip)) {
            return 'Local Network';
        }

        try {
            $response = Http::timeout(2)
                ->get("http://ip-api.com/json/{$ip}", ['fields' => 'status,country,regionName,city']);

            if ($response->successful() && $response->json('status') === 'success') {
                $parts = array_filter([
                    $response->json('city'),
                    $response->json('regionName'),
                    $response->json('country'),
                ]);
                return implode(', ', $parts) ?: null;
            }
        } catch (\Exception $e) {
            \Log::debug('Geolocation lookup failed for IP: ' . $ip);
        }

        return null;
    }

    private function metaKey(int|string $tokenId): string
    {
        return sprintf(self::TOKEN_META_KEY, $tokenId);
    }

    private function userTokensKey(int|string $userId): string
    {
        return sprintf(self::USER_TOKENS_KEY, $userId);
    }

    private function storeCurrentTokenInSet(User $user, int $tokenId): void
    {
        $this->redis()->sadd($this->userTokensKey($user->id), $tokenId);
        $meta = $this->redis()->hgetall($this->metaKey($tokenId));
        if (!empty($meta) && isset($meta['expires_at'])) {
            $ttl = max((strtotime($meta['expires_at']) - time()), 3600);
            $this->redis()->expire($this->userTokensKey($user->id), $ttl);
        }
    }

    private function loadSessionsFromDatabase(User $user): array
    {
        return $user->tokens()
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->get()
            ->map(fn($token) => $this->formatTokenToArray($token))
            ->toArray();
    }

    private function loadAllSessionsFromDatabase(?string $search): array
    {
        $query = PersonalAccessToken::query()
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });

        if ($search) {
            $query->whereHas('tokenable', function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($userId = request()->input('user_id')) {
            $query->where('tokenable_id', $userId);
        }

        return $query->get()
            ->map(fn($token) => $this->formatTokenToArray($token))
            ->toArray();
    }

    /**
     * Format a PersonalAccessToken model to a consistent session array structure.
     */
    private function formatTokenToArray($token): array
    {
        return [
            'id' => $token->id,
            'user_id' => $token->tokenable_id,
            'user_name' => $token->tokenable?->full_name,
            'user_email' => $token->tokenable?->email,
            'token_name' => $token->name,
            'ip_address' => $token->ip_address,
            'user_agent' => $token->user_agent,
            'device_type' => $token->device_type ?? 'Unknown',
            'browser' => $token->browser ?? 'Unknown',
            'platform' => $token->platform ?? 'Unknown',
            'location' => $token->location,
            'created_at' => $token->created_at?->toIso8601String(),
            'expires_at' => $token->expires_at?->toIso8601String(),
            'last_used_at' => $token->last_used_at?->toIso8601String(),
        ];
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
        if (preg_match('/edg/i', $userAgent)) return 'Edge';
        if (preg_match('/chrome/i', $userAgent)) return 'Chrome';
        if (preg_match('/firefox/i', $userAgent)) return 'Firefox';
        if (preg_match('/safari/i', $userAgent)) return 'Safari';
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
