<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
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

        $this->redis()->hmset($metaKey, [
            'user_id' => $user->id,
            'user_name' => $user->full_name,
            'user_email' => $user->email,
            'token_name' => $token->name,
            'abilities' => json_encode($token->abilities ?? ['*']),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_type' => $this->parseDeviceType($request->userAgent()),
            'browser' => $this->parseBrowser($request->userAgent()),
            'platform' => $this->parseOs($request->userAgent()),
            'created_at' => $token->created_at?->toIso8601String() ?? now()->toIso8601String(),
            'expires_at' => $token->expires_at?->toIso8601String(),
            'last_used_at' => now()->toIso8601String(),
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
            ->map(fn($token) => [
                'id' => $token->id,
                'user_id' => $user->id,
                'user_name' => $user->full_name,
                'user_email' => $user->email,
                'token_name' => $token->name,
                'created_at' => $token->created_at?->toIso8601String(),
                'expires_at' => $token->expires_at?->toIso8601String(),
                'last_used_at' => $token->last_used_at?->toIso8601String(),
            ])
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
            ->map(fn($token) => [
                'id' => $token->id,
                'user_id' => $token->tokenable_id,
                'user_name' => $token->tokenable?->full_name,
                'user_email' => $token->tokenable?->email,
                'token_name' => $token->name,
                'created_at' => $token->created_at?->toIso8601String(),
                'expires_at' => $token->expires_at?->toIso8601String(),
                'last_used_at' => $token->last_used_at?->toIso8601String(),
            ])
            ->toArray();
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
