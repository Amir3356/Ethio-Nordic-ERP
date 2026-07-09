<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TokenStateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function __construct(
        private readonly TokenStateService $tokenState
    ) {}

    /**
     * List all active sessions system-wide (admin view).
     * Returns fullname, email, device, location metadata for each session.
     */
    public function index(Request $request): JsonResponse
    {
        $sessions = $this->tokenState->getAllSessions(
            search: $request->search,
            userId: $request->user_id
        );

        $currentTokenId = (string) $request->user()?->currentAccessToken()?->getKey();

        $perPage = (int) $request->get('per_page', 15);
        $page = (int) $request->get('page', 1);
        $total = count($sessions);
        $offset = ($page - 1) * $perPage;
        $items = array_slice($sessions, $offset, $perPage);

        $enriched = array_map(fn($s) => [
            'id' => $s['id'] ?? null,
            'user_id' => $s['user_id'] ?? null,
            'user_name' => $s['user_name'] ?? null,
            'user_email' => $s['user_email'] ?? null,
            'device_type' => $s['device_type'] ?? null,
            'location' => $s['location'] ?? null,
            'is_current' => $currentTokenId !== null && (string) ($s['id'] ?? '') === $currentTokenId,
        ], $items);

        return $this->successResponse([
            'data' => array_values($enriched),
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => (int) ceil($total / $perPage),
        ]);
    }

    /**
     * Admin: Force terminate any session (e.g., on suspected compromise or employee termination).
     * Blacklists the token, removes metadata, revokes refresh tokens, and deletes the access token.
     */
    public function destroy(Request $request, $tokenId): JsonResponse
    {
        $currentTokenId = (string) $request->user()?->currentAccessToken()?->getKey();

        if ($currentTokenId !== '' && (string) $tokenId === $currentTokenId) {
            return $this->errorResponse('You cannot terminate your own session.', 422);
        }

        $result = $this->tokenState->forceTerminateSession($tokenId);

        if (!$result) {
            return $this->errorResponse('Session not found.', 404);
        }

        return $this->successResponse(null, 'Session terminated successfully.');
    }

    /**
     * Get all active sessions with full metadata (simplified list view).
     */
    public function active(Request $request): JsonResponse
    {
        $sessions = $this->tokenState->getAllSessions();

        $currentTokenId = (string) $request->user()?->currentAccessToken()?->getKey();

        return $this->successResponse(
            array_map(fn($s) => [
                'id' => $s['id'] ?? null,
                'user_id' => $s['user_id'] ?? null,
                'user_name' => $s['user_name'] ?? null,
                'user_email' => $s['user_email'] ?? null,
                'device_type' => $s['device_type'] ?? null,
                'location' => $s['location'] ?? null,
                'is_current' => $currentTokenId !== null && (string) ($s['id'] ?? '') === $currentTokenId,
            ], $sessions)
        );
    }

    /**
     * Admin: Force terminate ALL sessions for a specific user.
     * Used for suspected compromise or employee termination.
     */
    public function destroyAllForUser($userId): JsonResponse
    {
        $user = \App\Models\User::find($userId);
        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $count = $this->tokenState->forceTerminateAllUserSessions($user->id);

        return $this->successResponse([
            'revoked_count' => $count,
        ], "{$count} sessions terminated successfully for user {$user->full_name}.");
    }

    /**
     * Get the current idle session timeout configuration.
     */
    public function getIdleTimeout(): JsonResponse
    {
        $timeoutMinutes = \Cache::get('session_idle_timeout_minutes', config('session.idle_timeout', 30));

        return $this->successResponse([
            'idle_timeout_minutes' => (int) $timeoutMinutes,
            'default_minutes' => (int) config('session.idle_timeout', 30),
            'description' => 'Sessions with no activity for this duration will be automatically expired.',
        ]);
    }

    /**
     * Update the idle session timeout (admin only).
     * Changes take effect immediately for all new requests.
     */
    public function updateIdleTimeout(\Illuminate\Http\Request $request): JsonResponse
    {
        $request->validate([
            'idle_timeout_minutes' => 'required|integer|min:5|max:480',
        ]);

        $minutes = (int) $request->idle_timeout_minutes;

        // Store in cache (Redis) — persists across requests without restart
        \Cache::put('session_idle_timeout_minutes', $minutes, now()->addYear());

        return $this->successResponse([
            'idle_timeout_minutes' => $minutes,
            'message' => "Idle session timeout updated to {$minutes} minutes. Changes take effect immediately.",
        ]);
    }

    /**
     * Update session location (e.g., from browser geolocation).
     * Allows users to update their own session location when IP-based geolocation fails.
     */
    public function updateLocation(Request $request, string $tokenId): JsonResponse
    {
        $request->validate([
            'location' => 'required|string|max:255',
        ]);

        $token = \Laravel\Sanctum\PersonalAccessToken::find($tokenId);
        if (!$token) {
            return $this->errorResponse('Session not found.', 404);
        }

        // Only allow users to update their own session location
        if ($token->tokenable_id !== $request->user()->id) {
            return $this->errorResponse('Unauthorized to update this session.', 403);
        }

        $this->tokenState->updateSessionLocation($tokenId, $request->location);

        // Also persist to database
        $token->update(['location' => $request->location]);

        return $this->successResponse(null, 'Session location updated successfully.');
    }

    /**
     * Get geolocation from an IP address.
     * Accepts an optional IP parameter; if not provided, uses the request IP.
     */
    public function getGeoLocation(Request $request): JsonResponse
    {
        $ip = $request->input('ip', $request->ip());

        // Skip private/local IPs
        if ($ip === '127.0.0.1' || $ip === '::1' || $ip === 'localhost') {
            return $this->successResponse(['location' => null]);
        }

        if (preg_match('/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/', $ip)) {
            return $this->successResponse(['location' => null]);
        }

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(3)
                ->get("https://ip-api.com/json/{$ip}", ['fields' => 'status,country,regionName,city']);

            if ($response->successful() && $response->json('status') === 'success') {
                $parts = array_filter([
                    $response->json('city'),
                    $response->json('regionName'),
                    $response->json('country'),
                ]);
                $location = implode(', ', $parts) ?: null;
                return $this->successResponse(['location' => $location]);
            }
        } catch (\Exception $e) {
            \Log::debug('Geolocation lookup failed for IP: ' . $ip);
        }

        return $this->successResponse(['location' => null]);
    }

    /**
     * Get the client's public IP address.
     * Used by clients on local networks to discover their public IP.
     */
    public function getPublicIp(): JsonResponse
    {
        try {
            // Use multiple services as fallbacks
            $services = [
                'https://api.ipify.org?format=json',
                'https://httpbin.org/ip',
                'https://ipinfo.io/ip',
            ];

            foreach ($services as $url) {
                try {
                    $response = \Illuminate\Support\Facades\Http::timeout(3)->get($url);
                    if ($response->successful()) {
                        $data = $response->json();
                        // Handle different API response formats
                        $ip = $data['ip'] ?? $data['origin'] ?? null;
                        if ($ip) {
                            return $this->successResponse(['ip' => $ip]);
                        }
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }
        } catch (\Exception $e) {
            \Log::debug('Failed to get public IP');
        }

        return $this->successResponse(['ip' => null]);
    }
}
