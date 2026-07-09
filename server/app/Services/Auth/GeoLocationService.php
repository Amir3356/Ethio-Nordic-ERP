<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Http;

class GeoLocationService
{
    /**
     * Resolve IP address to a human-readable location string.
     */
    public function resolve(string $ip): ?string
    {
        if ($ip === '127.0.0.1' || $ip === '::1') {
            return null;
        }

        // Try ipinfo.io first
        try {
            $response = Http::timeout(3)->get("https://ipinfo.io/{$ip}/json");

            if ($response->successful() && $response->json('city')) {
                $location = $this->buildLocationString(
                    $response->json('city'),
                    $response->json('region'),
                    $response->json('country')
                );
                if ($location) return $location;
            }
        } catch (\Exception $e) {
            \Log::debug('ipinfo.io geolocation failed for IP: ' . $ip);
        }

        // Fallback to ip-api.com
        try {
            $response = Http::timeout(3)
                ->get("https://ip-api.com/json/{$ip}", ['fields' => 'status,country,regionName,city']);

            if ($response->successful() && $response->json('status') === 'success') {
                $location = $this->buildLocationString(
                    $response->json('city'),
                    $response->json('regionName'),
                    $response->json('country')
                );
                if ($location) return $location;
            }
        } catch (\Exception $e) {
            \Log::debug('ip-api.com geolocation failed for IP: ' . $ip);
        }

        return null;
    }

    private function buildLocationString(?string ...$parts): ?string
    {
        $filtered = array_filter($parts);
        return implode(', ', $filtered) ?: null;
    }
}
