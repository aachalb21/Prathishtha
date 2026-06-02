/**
 * QR Code API Service
 */

import apiClient from './api';

class QRCodeAPI {
  async getUserQRCode(userId) {
    try {
      const response = await apiClient.get(`/qr-code/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Failed to fetch QR code');
    }
  }

  async downloadUserQRCode(userId) {
    try {
      const response = await apiClient.get(`/qr-code/${userId}/download`, {
        responseType: 'blob',
      });
      return { success: true, data: response.data, contentType: response.headers['content-type'] };
    } catch (error) {
      return this._handleError(error, 'Failed to download QR code');
    }
  }

  async regenerateQRCode(userId) {
    try {
      const response = await apiClient.post(`/qr-code/${userId}/regenerate`);
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Failed to regenerate QR code');
    }
  }

  async verifyQRCode(qrData) {
    try {
      const response = await apiClient.post('/verify-qr', { qrData });
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Failed to verify QR code');
    }
  }

  async getQRCodeImage(userId) {
    try {
      const response = await apiClient.get(`/users/qr/${userId}/image`);
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Failed to fetch QR code image');
    }
  }

  _handleError(error, defaultMessage) {
    const errorResponse = { success: false, message: defaultMessage, error: null };
    if (error.response) {
      errorResponse.message = error.response.data?.message || defaultMessage;
      errorResponse.error = error.response.data?.error || error.response.statusText;
      errorResponse.status = error.response.status;
    } else if (error.request) {
      errorResponse.message = 'No response from server';
      errorResponse.error = error.message;
    } else {
      errorResponse.error = error.message;
    }
    return errorResponse;
  }
}

export default new QRCodeAPI();
