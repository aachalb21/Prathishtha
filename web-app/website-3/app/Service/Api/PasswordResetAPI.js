/**
 * Password Reset API Service
 */

import apiClient from './api';

class PasswordResetAPI {
  async forgotPassword(email) {
    try {
      const response = await apiClient.post('/users/auth/forgot-password', { email });
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Failed to process password reset request');
    }
  }

  async verifyResetToken(token) {
    try {
      const response = await apiClient.get(`/users/auth/verify-reset-token/${token}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Failed to verify reset token');
    }
  }

  async resetPassword(resetData) {
    try {
      const response = await apiClient.post('/users/auth/reset-password', {
        token: resetData.token,
        password: resetData.password,
        confirmPassword: resetData.confirmPassword,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Failed to reset password');
    }
  }

  _handleError(error, defaultMessage) {
    const errorResponse = { success: false, message: defaultMessage, error: null };
    if (error.response) {
      errorResponse.message = error.response.data?.message || defaultMessage;
      errorResponse.error = error.response.data?.error || error.response.statusText;
      errorResponse.status = error.response.status;
      if (error.response.data?.errors) {
        errorResponse.errors = error.response.data.errors;
      }
    } else if (error.request) {
      errorResponse.message = 'No response from server';
      errorResponse.error = error.message;
    } else {
      errorResponse.error = error.message;
    }
    return errorResponse;
  }
}

export default new PasswordResetAPI();
