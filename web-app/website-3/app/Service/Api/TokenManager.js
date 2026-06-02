/**
 * Token Manager Service
 * Handles secure storage and retrieval of authentication tokens
 * 
 * NOTE: For maximum security, consider migrating to httpOnly cookies
 * managed by the backend. This implementation uses localStorage with
 * additional safeguards.
 */

import logger from '../../../utils/logger';

const isDevelopment = process.env.NEXT_PUBLIC_ENV !== 'production';

class TokenManager {
  constructor() {
    this.accessTokenKey = 'auth_access_token';
    this.refreshTokenKey = 'auth_refresh_token';
    this.tokenExpiryKey = 'auth_token_expiry';
  }

  /**
   * Store tokens in localStorage
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   * @param {number} expiresIn - Token expiry time in seconds (default: 1 hour)
   */
  setTokens(accessToken, refreshToken, expiresIn = 3600) {
    try {
      if (typeof window !== 'undefined') {
        // Validate tokens before storing
        if (!accessToken || !refreshToken) {
          if (isDevelopment) {
            logger.warn('TokenManager: Invalid tokens provided');
          }
          return;
        }

        localStorage.setItem(this.accessTokenKey, accessToken);
        localStorage.setItem(this.refreshTokenKey, refreshToken);
        
        // Calculate expiry timestamp
        const expiryTime = Date.now() + expiresIn * 1000;
        localStorage.setItem(this.tokenExpiryKey, expiryTime.toString());
      }
    } catch (error) {
      if (isDevelopment) {
        logger.error('TokenManager: Error storing tokens');
      }
    }
  }

  /**
   * Get access token from localStorage
   * @returns {string|null} - Access token or null
   */
  getAccessToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.accessTokenKey);
    }
    return null;
  }

  /**
   * Get refresh token from localStorage
   * @returns {string|null} - Refresh token or null
   */
  getRefreshToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.refreshTokenKey);
    }
    return null;
  }

  /**
   * Check if access token is expired
   * @returns {boolean} - True if expired
   */
  isAccessTokenExpired() {
    if (typeof window !== 'undefined') {
      const expiry = localStorage.getItem(this.tokenExpiryKey);
      if (!expiry) return true;
      // Add 30 second buffer for clock skew
      return Date.now() >= (parseInt(expiry) - 30000);
    }
    return true;
  }

  /**
   * Update access token without changing refresh token
   * @param {string} accessToken - New access token
   * @param {number} expiresIn - Token expiry time in seconds
   */
  updateAccessToken(accessToken, expiresIn = 3600) {
    try {
      if (typeof window !== 'undefined') {
        if (!accessToken) {
          if (isDevelopment) {
            logger.warn('TokenManager: Invalid access token');
          }
          return;
        }
        localStorage.setItem(this.accessTokenKey, accessToken);
        const expiryTime = Date.now() + expiresIn * 1000;
        localStorage.setItem(this.tokenExpiryKey, expiryTime.toString());
      }
    } catch (error) {
      if (isDevelopment) {
        logger.error('TokenManager: Error updating access token');
      }
    }
  }

  /**
   * Clear all stored tokens
   */
  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.accessTokenKey);
      localStorage.removeItem(this.refreshTokenKey);
      localStorage.removeItem(this.tokenExpiryKey);
      // Also clear any pending verification data
      localStorage.removeItem('pending_verification_user');
      localStorage.removeItem('pending_verification_email');
    }
  }

  /**
   * Check if user has valid tokens
   * @returns {boolean} - True if valid tokens exist
   */
  hasValidTokens() {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    return !!(accessToken && refreshToken && !this.isAccessTokenExpired());
  }

  /**
   * Get time until token expires in milliseconds
   * @returns {number} - Milliseconds until expiry, 0 if expired
   */
  getTimeUntilExpiry() {
    if (typeof window !== 'undefined') {
      const expiry = localStorage.getItem(this.tokenExpiryKey);
      if (!expiry) return 0;
      const timeLeft = parseInt(expiry) - Date.now();
      return timeLeft > 0 ? timeLeft : 0;
    }
    return 0;
  }
}

export default new TokenManager();
