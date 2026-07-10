<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NetworkController extends Controller
{
    /**
     * Get geolocation from an IP address.
     */
    public function getGeoLocation(Request $request): JsonResponse
    {
        $ip = $request->input('ip', $request->ip());

        if ($ip === '127.0.0.1' || $ip === '::1' || $ip === 'localhost') {
            return $this->successResponse(['location' => null]);
        }

        if (preg_match('/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/', $ip)) {
            return $this->successResponse(['location' => null]);
        }

        $services = [
            function ($ip) {
                $response = \Illuminate\Support\Facades\Http::timeout(3)
                    ->get("https://ipinfo.io/{$ip}/json");
                if ($response->successful() && $response->json('city')) {
                    $parts = array_filter([
                        $response->json('city'),
                        $response->json('region'),
                        $response->json('country'),
                    ]);
                    return implode(', ', $parts) ?: null;
                }
                return null;
            },
            function ($ip) {
                $response = \Illuminate\Support\Facades\Http::timeout(3)
                    ->get("https://ip-api.com/json/{$ip}", ['fields' => 'status,country,regionName,city']);
                if ($response->successful() && $response->json('status') === 'success') {
                    $parts = array_filter([
                        $response->json('city'),
                        $response->json('regionName'),
                        $response->json('country'),
                    ]);
                    return implode(', ', $parts) ?: null;
                }
                return null;
            },
        ];

        foreach ($services as $service) {
            try {
                $location = $service($ip);
                if ($location) {
                    return $this->successResponse(['location' => $location]);
                }
            } catch (\Exception $e) {
                \Log::debug('Geolocation service failed: ' . $e->getMessage());
            }
        }

        return $this->successResponse(['location' => null]);
    }

    /**
     * Get the client's public IP address.
     */
    public function getPublicIp(): JsonResponse
    {
        try {
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