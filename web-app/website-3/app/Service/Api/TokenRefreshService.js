/**
 * Token Refresh Service
 * Handles access token refresh using refresh token
 */

import apiClient from './api';
import TokenManager from './TokenManager';

class TokenRefreshService {
  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token from backend
   * @returns {Promise<object>} - New access token and expiry
   */
  async refreshAccessToken(refreshToken) {
    try {
      const response = await apiClient.post('/users/auth/refresh-token', {
        refreshToken: refreshToken || TokenManager.getRefreshToken(),
      });

      const { accessToken, expiresIn } = response.data;

      // Update token
      TokenManager.updateAccessToken(accessToken, expiresIn);

      return {
        success: true,
        data: {
          accessToken,
          expiresIn,
        },
      };
    } catch (error) {
      // Clear tokens if refresh fails (invalid/expired refresh token)
      TokenManager.clearTokens();
      return {
        success: false,
        error: error.response?.data?.message || 'Token refresh failed',
        statusCode: error.response?.status,
      };
    }
  }

  /**
   * Check and refresh token if expired
   * @returns {Promise<string|null>} - Valid access token or null
   */
  async getValidAccessToken() {
    if (TokenManager.isAccessTokenExpired()) {
      const refreshResponse = await this.refreshAccessToken();
      if (refreshResponse.success) {
        return refreshResponse.data.accessToken;
      }
      return null;
    }
    return TokenManager.getAccessToken();
  }
}

export default new TokenRefreshService();
