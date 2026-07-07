import { api } from './client';

export const authAPI = {
  login: (email: string, password: string, twoFactorCode: string | null = null) =>
    api.post('/auth/login', { email, password, two_factor_code: twoFactorCode }),

  logout: () =>
    api.post('/auth/logout'),

  getCurrentUser: () =>
    api.get('/auth/me'),

  changePassword: (currentPassword: string, password: string) =>
    api.post('/auth/change-password', { current_password: currentPassword, password, password_confirmation: password }),

  setupTwoFactor: () =>
    api.post('/auth/setup-2fa'),

  verifyTwoFactor: (code: string) =>
    api.post('/auth/verify-2fa', { two_factor_code: code }),

  disableTwoFactor: (password: string, code: string) =>
    api.post('/auth/disable-2fa', { password, two_factor_code: code }),

  setupTwoFactorOnboarding: (token: string) =>
    api.post('/auth/setup-2fa-onboarding', { token }),

  verifyTwoFactorOnboarding: (token: string, code: string) =>
    api.post('/auth/verify-2fa-onboarding', { token, two_factor_code: code }),

  skipTwoFactorOnboarding: (token: string) =>
    api.post('/auth/skip-2fa-onboarding', { token }),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),

  getActiveSessions: () =>
    api.get('/auth/sessions'),

  revokeSession: (tokenId: string) =>
    api.delete(`/auth/sessions/${tokenId}`),

  revokeAllOtherSessions: () =>
    api.post('/auth/revoke-all-sessions'),
};
