export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  NOT_FOUND: '/404',
  FORBIDDEN: '/403'
};

export const APP_CONFIG = {
  APP_NAME: 'VectorAdmin Pro',
  VERSION: '1.0.2',
  
  API_BASE_URL: '/api',
  TIMEOUT: 10000,

  STORAGE_KEYS: {
    TOKEN: 'token',
    REFRESH_TOKEN: 'refresh_token',
    THEME: 'theme_settings',
    USER_INFO: 'user_info',
    PERMISSIONS: 'permissions',
    REMEMBER_ME: 'remember_me_expires'
  },

  ROUTES
};
