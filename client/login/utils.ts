interface AuthResponseData {
  token?: string;
  refresh_token?: string;
  user?: Record<string, unknown>;
}

export const storeAuth = (data: AuthResponseData): void => {
  if (!data || typeof data !== 'object') return;
  if (data.token) localStorage.setItem('authToken', data.token);
  if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
};

export const getQrCodeDataUrl = (url: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
};

export const getAuthErrorMessage = (err: unknown): string => {
  console.error('Login error:', err);

  const axiosErr = err as {
    response?: {
      data?: Record<string, unknown>;
      status?: number;
      statusText?: string;
    };
    request?: unknown;
    message?: string;
  };

  if (!axiosErr.response) {
    if (axiosErr.request) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }
    if (axiosErr.message) {
      return axiosErr.message;
    }
    return 'An unexpected error occurred. Please try again.';
  }

  const responseData = axiosErr.response.data;
  const message =
    (typeof responseData === 'object' && responseData !== null
      ? String(responseData.message ?? responseData.error ?? '')
      : '') ||
    axiosErr.response.statusText ||
    '';

  if (message) {
    return message;
  }

  if (
    responseData &&
    typeof responseData === 'object' &&
    'errors' in responseData &&
    typeof responseData.errors === 'object' &&
    responseData.errors !== null
  ) {
    const firstError = Object.values(responseData.errors as Record<string, unknown>)[0];
    if (Array.isArray(firstError) && firstError[0]) {
      return String(firstError[0]);
    }
  }

  return `Request failed with status ${axiosErr.response.status}. Please try again.`;
};
