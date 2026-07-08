export const getQrCodeDataUrl = (url: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
};

export const getAuthErrorMessage = (err: unknown): string => {
  const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
  return (
    axiosErr.response?.data?.message ||
    axiosErr.response?.data?.error ||
    'An error occurred. Please try again.'
  );
};
