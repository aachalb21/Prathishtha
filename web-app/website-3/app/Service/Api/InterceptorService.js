/**
 * API Interceptor Service
 * Handles automatic token attachment and refresh on 401 errors
 */

import apiClient, { setAuthToken } from './api';
import TokenManager from './TokenManager';
import TokenRefreshService from './TokenRefreshService';

let isRefreshing = false;
let refreshQueue = [];

/**
 * Process queued requests after token refresh
 * @param {string} token - New access token
 */
const processQueue = (token) => {
  refreshQueue.forEach((prom) => prom.resolve(token));
  refreshQueue = [];
};

/**
 * Add request to queue during token refresh
 * @returns {Promise<string>} - New access token
 */
const addToQueue = () => {
  return new Promise((resolve) => {
    refreshQueue.push({ resolve });
  });
};

/**
 * Setup request interceptor to attach access token
 */
export const setupRequestInterceptor = () => {
  apiClient.interceptors.request.use(
    (config) => {
      const accessToken = TokenManager.getAccessToken();

      // Attach token to request header
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
};

/**
 * Setup response interceptor to handle 401 and refresh token
 */
export const setupResponseInterceptor = () => {
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Handle 401 Unauthorized (token expired)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          // Wait for token refresh to complete
          const token = await addToQueue();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }

        isRefreshing = true;

        try {
          // Attempt to refresh token
          const refreshResponse = await TokenRefreshService.refreshAccessToken();

          if (refreshResponse.success) {
            const newToken = refreshResponse.data.accessToken;
            setAuthToken(newToken);
            processQueue(newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          } else {
            // Refresh failed, redirect to login
            TokenManager.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }
        } catch (refreshError) {
          TokenManager.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

/**
 * Initialize all interceptors
 */
export const initializeInterceptors = () => {
  setupRequestInterceptor();
  setupResponseInterceptor();
};

export default { setupRequestInterceptor, setupResponseInterceptor, initializeInterceptors };
