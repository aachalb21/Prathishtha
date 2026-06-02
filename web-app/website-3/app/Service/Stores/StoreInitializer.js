/**
 * Store Initialization Service
 * Initializes all stores on app startup
 */

import { useAuthStore } from './authStore';
import { initializeInterceptors } from '../Api/InterceptorService';
import logger from '../../../utils/logger';

/**
 * Initialize all application stores
 * Call this once in your app layout or root component
 */
export const initializeStores = async () => {
  try {
    // Initialize interceptors for token management
    initializeInterceptors();

    // Initialize auth store
    await useAuthStore.getState().initializeAuth();

    return { success: true };
  } catch (error) {
    logger.error('Store initialization failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reset all stores to initial state
 * Useful for logout or app reset
 */
export const resetAllStores = async () => {
  try {
    await useAuthStore.getState().logout();
    return { success: true };
  } catch (error) {
    logger.error('Store reset failed:', error);
    return { success: false, error: error.message };
  }
};
