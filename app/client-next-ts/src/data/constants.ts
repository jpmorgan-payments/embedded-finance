// Always use current origin for MSW to work properly in production
export const API_URL =
  typeof window !== 'undefined' ? window.location.origin : '';

// Unique Client Identifier (C2)
export const CLIENT_ID = import.meta.env.CLIENT_ID ?? '1234567890';

// Unique identifier for the platform.
export const PLATFORM_ID = import.meta.env.PLATFORM_ID ?? '0000123456';

// JWT Client token
export const CLIENT_TOKEN = import.meta.env.CLIENT_TOKEN ?? 'fake-token';

export const GITHUB_REPO =
  'https://github.com/jpmorgan-payments/embedded-finance';

export const FORGEROCK_CONFIG = {
  AM_URL: `https://${import.meta.env.VITE_FR_URL}/am`,
  APP_URL: window.location.origin,
  WEB_OAUTH_CLIENT: import.meta.env.VITE_FR_CLIENT,
  REALM_PATH: 'alpha',
};
