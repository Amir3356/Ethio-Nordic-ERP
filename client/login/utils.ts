export const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least 1 uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least 1 lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least 1 number.';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least 1 special character.';
  }
  return null;
};

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
