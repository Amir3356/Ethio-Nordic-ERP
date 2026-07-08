import { api } from './client';

interface ReverseGeocodeResult {
  city?: string;
  region?: string;
  country?: string;
  display_name: string;
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
 * Get browser geolocation and convert to city/country string
 */
export async function getBrowserLocation(): Promise<string | null> {
  if (!navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
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
        // User denied permission or error occurred
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
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
