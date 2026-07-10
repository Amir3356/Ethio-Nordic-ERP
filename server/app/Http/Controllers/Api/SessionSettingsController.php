<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionSettingsController extends Controller
{
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
     */
    public function updateIdleTimeout(Request $request): JsonResponse
    {
        $request->validate([
            'idle_timeout_minutes' => 'required|integer|min:5|max:480',
        ]);

        $minutes = (int) $request->idle_timeout_minutes;

        \Cache::put('session_idle_timeout_minutes', $minutes, now()->addYear());

        return $this->successResponse([
            'idle_timeout_minutes' => $minutes,
            'message' => "Idle session timeout updated to {$minutes} minutes. Changes take effect immediately.",
        ]);
    }
}