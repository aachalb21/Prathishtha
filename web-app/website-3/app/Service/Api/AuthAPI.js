/**
 * Auth API Service
 * Handles all authentication-related API calls
 */

import apiClient from './api';

class AuthAPI {
  /**
   * Login user
   */
  async login(credentials) {
    try {
      const response = await apiClient.post('/users/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return this._handleError(error, 'Login failed');
    }
  }

  /**
   * Sign up new user
   */
  async signup(userData) {
    try {
      const response = await apiClient.post('/users/auth/signup', {
        prn: userData.prn,
        name: userData.name,
        email: userData.email,
        password: userData.password,
        department: userData.department,
        year: userData.year,
        type: userData.type,
        gender: userData.gender || '',
        college_name: userData.college_name || '',
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return this._handleError(error, 'Signup failed');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const response = await apiClient.post('/users/auth/refresh-token', { refreshToken });
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Token refresh failed');
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken) {
    try {
      const response = await apiClient.post('/users/auth/logout', { refreshToken });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: true, message: 'Logged out locally' };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      const response = await apiClient.post('/users/auth/forgot-password', { email });
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Password reset request failed');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetData) {
    try {
      const response = await apiClient.post('/users/auth/reset-password', {
        token: resetData.token,
        newPassword: resetData.newPassword,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Password reset failed');
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(email, otp) {
    try {
      const response = await apiClient.post('/users/auth/verify-email', { email, otp });
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Email verification failed');
    }
  }

  /**
   * Resend OTP to email
   */
  async resendOTP(email) {
    try {
      const response = await apiClient.post('/users/auth/resend-otp', { email });
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Failed to resend OTP');
    }
  }

  /**
   * Update email for unverified user (during verification)
   */
  async updateEmail(oldEmail, newEmail) {
    try {
      const response = await apiClient.post('/users/auth/update-email', { oldEmail, newEmail });
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Failed to update email');
    }
  }

  /**
   * Change password
   */
  async changePassword(passwordData) {
    try {
      const response = await apiClient.post('/users/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Password change failed');
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    try {
      const response = await apiClient.get('/users/me');
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Failed to fetch user profile');
    }
  }

  _handleError(error, defaultMessage) {
    const errorMessage = error.response?.data?.message || error.message || defaultMessage;
    const statusCode = error.response?.status;
    return { success: false, error: errorMessage, statusCode };
  }
}

export default new AuthAPI();
