/**
 * Authentication Utility Functions
 * Handles token validation, refresh, and auth status checking
 */

import TokenManager from '../Api/TokenManager';
import TokenRefreshService from '../Api/TokenRefreshService';
import { setAuthToken } from '../Api/api';
import logger from '../../../utils/logger';

/**
 * Check if token is expired with buffer time
 * @param {number} bufferSeconds - Buffer time before actual expiry (default: 60 seconds)
 * @returns {boolean} - True if token is expired or about to expire
 */
export const isTokenExpired = (bufferSeconds = 60) => {
  const expiry = localStorage.getItem('auth_token_expiry');
  if (!expiry) return true;

  const expiryTime = parseInt(expiry);
  const bufferTime = bufferSeconds * 1000;
  return Date.now() >= expiryTime - bufferTime;
};

/**
 * Get current valid access token
 * Refreshes if expired, returns null if refresh fails
 * @returns {Promise<string|null>} - Valid access token or null
 */
export const getValidAccessToken = async () => {
  const accessToken = TokenManager.getAccessToken();

  // If no token, return null
  if (!accessToken) {
    return null;
  }

  // If token is still valid, return it
  if (!isTokenExpired()) {
    return accessToken;
  }

  // Token expired, try to refresh
  const refreshResponse = await TokenRefreshService.refreshAccessToken();

  if (refreshResponse.success) {
    const newToken = refreshResponse.data.accessToken;
    setAuthToken(newToken);
    return newToken;
  }

  // Refresh failed, clear tokens and return null
  TokenManager.clearTokens();
  setAuthToken(null);
  return null;
};

/**
 * Check authentication status
 * @returns {Object} - Auth status with user and tokens
 * {
 *   isAuthenticated: boolean,
 *   hasValidToken: boolean,
 *   requiresVerification: boolean,
 *   user: object|null,
 *   error: string|null
 * }
 */
export const checkAuth = () => {
  try {
    const accessToken = TokenManager.getAccessToken();
    const refreshToken = TokenManager.getRefreshToken();

    // No tokens = not authenticated
    if (!accessToken || !refreshToken) {
      return {
        isAuthenticated: false,
        hasValidToken: false,
        requiresVerification: false,
        user: null,
        error: 'No tokens found',
      };
    }

    // Tokens exist but check if expired
    const isExpired = isTokenExpired();

    return {
      isAuthenticated: true,
      hasValidToken: !isExpired,
      requiresVerification: false,
      user: null,
      error: isExpired ? 'Token expired' : null,
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      hasValidToken: false,
      requiresVerification: false,
      user: null,
      error: error.message,
    };
  }
};

/**
 * Check if user can access protected routes
 * @param {boolean} isAuthenticated - From Zustand store
 * @param {boolean} requiresVerification - From Zustand store
 * @param {boolean} isLoading - From Zustand store
 * @param {string} requiredAuth - 'auth' | 'verified' | 'none'
 * @returns {Object} - Auth check result
 * {
 *   authorized: boolean,
 *   loading: boolean,
 *   redirectTo: string|null
 * }
 */
export const checkRouteAccess = (isAuthenticated, requiresVerification, isLoading, requiredAuth = 'auth') => {
  // Still loading, can't determine yet
  if (isLoading) {
    return {
      authorized: false,
      loading: true,
      redirectTo: null,
    };
  }

  let authorized = false;
  let redirectTo = null;

  switch (requiredAuth) {
    case 'none':
      // Public route, everyone can access
      authorized = true;
      break;

    case 'auth':
      // Authenticated route (includes users awaiting verification)
      if (isAuthenticated || requiresVerification) {
        authorized = true;
      } else {
        authorized = false;
        redirectTo = '/login';
      }
      break;

    case 'verified':
      // Verified route (fully authenticated, no pending verification)
      if (isAuthenticated && !requiresVerification) {
        authorized = true;
      } else if (isAuthenticated && requiresVerification) {
        // User awaiting verification
        authorized = false;
        redirectTo = '/verify';
      } else {
        // Not authenticated at all
        authorized = false;
        redirectTo = '/login';
      }
      break;

    default:
      authorized = false;
      redirectTo = '/login';
  }

  return {
    authorized,
    loading: false,
    redirectTo,
  };
};

/**
 * Check if user should be redirected from public route
 * @param {boolean} isAuthenticated - From Zustand store
 * @param {boolean} requiresVerification - From Zustand store
 * @param {boolean} isLoading - From Zustand store
 * @returns {Object} - Redirect check result
 * {
 *   shouldRedirect: boolean,
 *   redirectTo: string|null,
 *   canRender: boolean
 * }
 */
export const checkPublicRouteAccess = (isAuthenticated, requiresVerification, isLoading) => {
  // Still loading
  if (isLoading) {
    return {
      shouldRedirect: false,
      redirectTo: null,
      canRender: false,
    };
  }

  // Fully authenticated (verified), redirect to dashboard
  if (isAuthenticated && !requiresVerification) {
    return {
      shouldRedirect: true,
      redirectTo: '/dashboard',
      canRender: false,
    };
  }

  // Awaiting verification or not authenticated, allow access to public routes
  return {
    shouldRedirect: false,
    redirectTo: null,
    canRender: true,
  };
};

/**
 * Ensure token is set in axios headers
 * Call this on app initialization
 * @returns {boolean} - True if token was set successfully
 */
export const ensureTokenInHeaders = () => {
  try {
    const accessToken = TokenManager.getAccessToken();
    if (accessToken) {
      setAuthToken(accessToken);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error setting token in headers:', error);
    return false;
  }
};

/**
 * Initialize authentication on app startup
 * Sets token in headers and validates it
 * @returns {Promise<boolean>} - True if successfully initialized
 */
export const initializeAuthOnStartup = async () => {
  try {
    // Ensure token is in axios headers
    ensureTokenInHeaders();

    // Check if token needs refresh
    if (isTokenExpired(120)) {
      // Token expires in less than 2 minutes, refresh it
      const validToken = await getValidAccessToken();
      return !!validToken;
    }

    return true;
  } catch (error) {
    logger.error('Auth initialization error:', error);
    return false;
  }
};

/**
 * Decode JWT token without verification (just to check structure)
 * This is safe because we verify with backend via Authorization header
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded token or null
 */
const decodeTokenLocally = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    logger.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Verify access token with backend
 * Makes a test API call with the token in Authorization header
 * The backend checkAuth middleware will validate the token
 * @returns {Promise<Object>} - Verification result
 * {
 *   isValid: boolean,
 *   user: object|null,
 *   error: string|null,
 *   isExpired: boolean
 * }
 */
export const verifyTokenWithBackend = async () => {
  try {
    const accessToken = TokenManager.getAccessToken();

    // No token, not authenticated
    if (!accessToken) {
      return {
        isValid: false,
        user: null,
        error: 'No access token found',
        isExpired: false,
      };
    }

    // Decode token locally to check expiration
    const decoded = decodeTokenLocally(accessToken);
    if (!decoded) {
      return {
        isValid: false,
        user: null,
        error: 'Invalid token format',
        isExpired: false,
      };
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && now >= decoded.exp) {
      return {
        isValid: false,
        user: null,
        error: 'Token expired',
        isExpired: true,
      };
    }

    // Ensure token is in headers
    setAuthToken(accessToken);

    // Make a test API call to verify token is valid with backend checkAuth
    try {
      const apiClient = (await import('../Api/api.js')).default;

      // Try calling /users/me first (for verified users)
      try {
        const response = await apiClient.get('/users/me');
        if (response.status === 200 && response.data.success) {
          return {
            isValid: true,
            user: response.data.data?.user || response.data.data,
            error: null,
            isExpired: false,
          };
        }
      } catch (err) {
        // If /users/me fails with 403 (not verified), that's ok - token is still valid
        // If it fails with 401, token is invalid
        if (err.response?.status === 403) {
          // User not verified but token is valid
          return {
            isValid: true,
            user: { id: decoded.id, email: decoded.email },
            error: null,
            isExpired: false,
          };
        } else if (err.response?.status === 401) {
          // Token is invalid
          return {
            isValid: false,
            user: null,
            error: 'Access token invalid',
            isExpired: false,
          };
        } else {
          // Other error, assume token is ok if it has valid structure
          return {
            isValid: true,
            user: { id: decoded.id, email: decoded.email },
            error: null,
            isExpired: false,
          };
        }
      }
    } catch (error) {
      // If we can decode it locally and it's not expired, it's probably valid
      if (decoded && decoded.exp && now < decoded.exp) {
        return {
          isValid: true,
          user: { id: decoded.id, email: decoded.email },
          error: null,
          isExpired: false,
        };
      }

      return {
        isValid: false,
        user: null,
        error: error.message || 'Token verification failed',
        isExpired: false,
      };
    }
  } catch (error) {
    return {
      isValid: false,
      user: null,
      error: error.message || 'Token verification failed',
      isExpired: false,
    };
  }
};

/**
 * Check if user has valid access token by verifying with backend
 * @param {boolean} isAuthenticated - From Zustand store
 * @param {boolean} isLoading - From Zustand store
 * @param {string} requiredAuth - 'auth' | 'verified' | 'none'
 * @returns {Promise<Object>} - Route access result
 * {
 *   authorized: boolean,
 *   loading: boolean,
 *   redirectTo: string|null,
 *   tokenValid: boolean
 * }
 */
export const checkAuthWithBackend = async (isAuthenticated, isLoading, requiredAuth = 'auth') => {
  // Still loading
  if (isLoading) {
    return {
      authorized: false,
      loading: true,
      redirectTo: null,
      tokenValid: false,
    };
  }

  // Not authenticated
  if (!isAuthenticated) {
    return {
      authorized: false,
      loading: false,
      redirectTo: '/login',
      tokenValid: false,
    };
  }

  // Verify token with backend
  const verification = await verifyTokenWithBackend();

  // Handle token expiration - attempt refresh
  if (verification.isExpired) {
    try {
      const refreshResult = await TokenRefreshService.refreshAccessToken();
      if (refreshResult.success) {
        // Token refreshed, recurse to check again
        return checkAuthWithBackend(isAuthenticated, false, requiredAuth);
      }
    } catch (error) {
      // Refresh failed, token invalid
    }

    // Refresh failed or expired
    TokenManager.clearTokens();
    setAuthToken(null);

    return {
      authorized: false,
      loading: false,
      redirectTo: '/login',
      tokenValid: false,
    };
  }

  // Token invalid
  if (!verification.isValid) {
    TokenManager.clearTokens();
    setAuthToken(null);

    return {
      authorized: false,
      loading: false,
      redirectTo: '/login',
      tokenValid: false,
    };
  }

  // Token is valid - allow based on requirement
  return {
    authorized: true,
    loading: false,
    redirectTo: null,
    tokenValid: true,
  };
};

export default {
  isTokenExpired,
  getValidAccessToken,
  checkAuth,
  checkRouteAccess,
  checkPublicRouteAccess,
  ensureTokenInHeaders,
  initializeAuthOnStartup,
  verifyTokenWithBackend,
  checkAuthWithBackend,
};
