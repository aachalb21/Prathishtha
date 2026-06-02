/**
 * Environment Configuration
 * Manages different configurations for development, staging, and production environments
 */

const environments = {
  development: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/',
    APP_ENV: 'development',
    DEBUG: true,
    LOG_LEVEL: 'debug',
    CACHE_TIMEOUT: 0, // Disabled in dev
  },
  production: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://pratishtha-api.sakec.ac.in',
    APP_ENV: 'production',
    DEBUG: false,
    LOG_LEVEL: 'error',
    CACHE_TIMEOUT: 600000, // 10 minutes
  },
};

const getConfig = () => {
  const env = process.env.NEXT_PUBLIC_ENV || 'development';
  return environments[env] || environments.development;
};

export default getConfig();
