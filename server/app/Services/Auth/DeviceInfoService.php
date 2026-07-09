<?php

namespace App\Services\Auth;

class DeviceInfoService
{
    /**
     * Parse device type from user agent string.
     */
    public function parseDeviceType(?string $userAgent): string
    {
        if (!$userAgent) return 'Unknown';

        if (preg_match('/iphone/i', $userAgent)) return 'iPhone';
        if (preg_match('/ipad/i', $userAgent)) return 'iPad';
        if (preg_match('/android/i', $userAgent)) {
            if (preg_match('/tablet|pad/i', $userAgent)) return 'Android Tablet';
            return 'Android Phone';
        }
        if (preg_match('/tablet/i', $userAgent)) return 'Tablet';
        if (preg_match('/windows/i', $userAgent)) return 'Windows PC';
        if (preg_match('/macintosh|mac os/i', $userAgent)) return 'Mac';
        if (preg_match('/linux/i', $userAgent)) return 'Linux PC';
        if (preg_match('/chromebook/i', $userAgent)) return 'Chromebook';
        if (preg_match('/mobile/i', $userAgent)) return 'Mobile Device';

        return 'Desktop';
    }

    /**
     * Parse browser name from user agent string.
     */
    public function parseBrowser(?string $userAgent): string
    {
        if (!$userAgent) return 'Unknown';
        if (preg_match('/edg/i', $userAgent)) return 'Edge';
        if (preg_match('/chrome/i', $userAgent)) return 'Chrome';
        if (preg_match('/firefox/i', $userAgent)) return 'Firefox';
        if (preg_match('/safari/i', $userAgent)) return 'Safari';
        return 'Other';
    }

    /**
     * Parse operating system from user agent string.
     */
    public function parseOs(?string $userAgent): string
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
