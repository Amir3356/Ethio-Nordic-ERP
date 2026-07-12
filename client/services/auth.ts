import { api } from './client';

export const authAPI = {
  login: (email: string, password: string, twoFactorCode: string | null = null) =>
    api.post('/auth/login', { email, password, two_factor_code: twoFactorCode }),

  logout: () =>
    api.post('/auth/logout'),

  setupTwoFactorOnboarding: (token: string) =>
    api.post('/auth/setup-2fa-onboarding', { token }),

  verifyTwoFactorOnboarding: (token: string, code: string) =>
    api.post('/auth/verify-2fa-onboarding', { token, two_factor_code: code }),
};
