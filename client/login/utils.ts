interface AuthResponseData {
  token?: string;
  refresh_token?: string;
  user?: Record<string, unknown>;
}

export const storeAuth = (data: AuthResponseData): void => {
  if (data.token) localStorage.setItem('authToken', data.token);
  if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
};

export const getQrCodeDataUrl = (url: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
};

export const getAuthErrorMessage = (err: unknown): string => {
  const axiosErr = err as { response?: { data?: { message?: string; error?: string; errors?: unknown } } };
  const responseData = axiosErr.response?.data;
  const message =
    responseData?.message ||
    responseData?.error ||
    '';

  if (message) {
    return message;
  }

  if (responseData?.errors && typeof responseData.errors === 'object') {
    const firstError = Object.values(responseData.errors)[0];
    if (Array.isArray(firstError) && firstError[0]) {
      return String(firstError[0]);
    }
  }

  return 'An error occurred. Please try again.';
};
