import { api } from './client';

interface ReverseGeocodeResult {
  city?: string;
  region?: string;
  country?: string;
  display_name: string;
}

interface PublicIpResponse {
  ip: string | null;
}

interface GeoLocationResponse {
  location: string | null;
}

/**
 * Reverse geocode coordinates to city/country using Nominatim (OpenStreetMap)
 */
async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      {
        headers: {
          'Accept-Language': 'en',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const address = data.address || {};

    return {
      city: address.city || address.town || address.village || address.county,
      region: address.state || address.region,
      country: address.country,
      display_name: data.display_name || '',
    };
  } catch {
    return null;
  }
}

/**
 * Format reverse geocode result into a location string
 */
function formatLocation(result: ReverseGeocodeResult): string {
  const parts = [result.city, result.region, result.country].filter(Boolean);
  return parts.join(', ') || result.display_name?.split(',').slice(0, 3).join(',') || 'Unknown';
}

/**
 * Get the client's public IP address from the server
 */
async function getPublicIp(): Promise<string | null> {
  try {
    const response = await api.get('/sessions/public-ip');
    const data = response.data?.data as PublicIpResponse;
    return data?.ip || null;
  } catch {
    return null;
  }
}

/**
 * Get geolocation from an IP address using the server
 */
async function getGeoLocationFromIp(ip: string): Promise<string | null> {
  try {
    const response = await api.post('/sessions/geo-location', { ip });
    const data = response.data?.data as GeoLocationResponse;
    return data?.location || null;
  } catch {
    return null;
  }
}

/**
 * Get location from public IP using ip-api.com (client-side fallback)
 */
async function getLocationFromPublicIP(): Promise<string | null> {
  try {
    const response = await fetch('https://ip-api.com/json/?fields=status,country,regionName,city', {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.status === 'success') {
      const parts = [data.city, data.regionName, data.country].filter(Boolean);
      return parts.join(', ') || null;
    }
  } catch {
    // Fallback failed
  }
  return null;
}

/**
 * Get browser geolocation and convert to city/country string.
 * Falls back to server-side or public IP geolocation if browser geolocation fails.
 */
export async function getBrowserLocation(): Promise<string | null> {
  // Try browser geolocation first (most accurate)
  if (navigator.geolocation) {
    const browserLocation = await new Promise<string | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const result = await reverseGeocode(latitude, longitude);
          if (result) {
            resolve(formatLocation(result));
          } else {
            resolve(null);
          }
        },
        () => {
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    });

    if (browserLocation) {
      return browserLocation;
    }
  }

  // Fallback 1: Get public IP from server, then geolocate it
  const publicIp = await getPublicIp();
  if (publicIp) {
    const ipLocation = await getGeoLocationFromIp(publicIp);
    if (ipLocation) {
      return ipLocation;
    }
  }

  // Fallback 2: Try client-side public IP geolocation
  return getLocationFromPublicIP();
}

/**
 * Update session location on the backend
 */
export async function updateSessionLocation(tokenId: string, location: string): Promise<void> {
  try {
    await api.put(`/sessions/${tokenId}/location`, { location });
  } catch {
    // Silently fail - location update is non-critical
  }
}
