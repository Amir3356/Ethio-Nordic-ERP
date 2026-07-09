<?php

namespace App\Services\Auth;

use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Http\Request;

class LoginActivityService
{
    public function __construct(
        protected DeviceInfoService $deviceInfo,
        protected GeoLocationService $geoLocation,
    ) {}

    /**
     * Record a login attempt (success or failure).
     */
    public function log(
        Request $request,
        ?User $user,
        string $status,
        ?string $reason = null,
    ): void {
        $ip = $request->ip();

        LoginActivity::create([
            'user_id' => $user?->id,
            'email' => $request->email ?? $user?->email ?? 'unknown@unknown.com',
            'ip_address' => $ip,
            'user_agent' => $request->userAgent(),
            'device_type' => $this->deviceInfo->parseDeviceType($request->userAgent()),
            'browser' => $this->deviceInfo->parseBrowser($request->userAgent()),
            'platform' => $this->deviceInfo->parseOs($request->userAgent()),
            'location' => $this->geoLocation->resolve($ip),
            'status' => $status,
            'failure_reason' => $reason,
            'login_at' => now(),
        ]);
    }
}
