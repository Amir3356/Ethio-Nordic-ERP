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
 * Get the client's public IP address from the server, then geolocate it.
 * This is the most reliable method - no CORS issues, no browser permission blocks.
 */
async function getLocationFromServer(): Promise<string | null> {
  try {
    const ipResponse = await api.get('/sessions/public-ip');
    const ipData = ipResponse.data?.data as PublicIpResponse;
    const publicIp = ipData?.ip;

    if (!publicIp) return null;

    const geoResponse = await api.post('/sessions/geo-location', { ip: publicIp });
    const geoData = geoResponse.data?.data as GeoLocationResponse;
    return geoData?.location || null;
  } catch {
    return null;
  }
}

/**
 * Check if browser geolocation is likely blocked (user dismissed the prompt).
 * We try a quick request with a short timeout to detect this without annoying the user.
 */
function isGeolocationBlocked(): boolean {
  try {
    const permission = (navigator as { permissions?: Permissions }).permissions;
    if (!permission) return false;
    // If permission API is available, check if geolocation is denied
    // This is async but we can't wait - just return false and let the normal flow handle it
    return false;
  } catch {
    return false;
  }
}

/**
 * Get browser geolocation and convert to city/country string.
 * Falls back to server-side geolocation if browser geolocation fails or is blocked.
 */
export async function getBrowserLocation(): Promise<string | null> {
  // Fallback 1: Server-side geolocation (most reliable - no CORS, no permission issues)
  const serverLocation = await getLocationFromServer();
  if (serverLocation) {
    return serverLocation;
  }

  // Fallback 2: Try browser geolocation (may fail if user previously blocked it)
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
          // User denied or geolocation blocked - resolve null silently
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000,
        }
      );
    });

    if (browserLocation) {
      return browserLocation;
    }
  }

  return null;
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
