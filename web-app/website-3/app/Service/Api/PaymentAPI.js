/**
 * Payment API Service - Handles payment-related API calls
 */

import apiClient from './api';

const PaymentAPI = {
  /**
   * Create payment order (initiate payment flow)
   * @param {string} orderId - Order ID from registration
   * @returns {Promise} Payment order details
   */
  createPaymentOrder: async (orderId) => {
    const res = await apiClient.post('/payments/create-order', { orderId });
    return res.data;
  },

  /**
   * Get order status
   * @param {string} orderId - Order ID
   * @returns {Promise} Order details with status
   */
  getOrderStatus: async (orderId) => {
    const res = await apiClient.get(`/payments/order/${orderId}`);
    return res.data;
  },

  /**
   * Get user's payment history
   * @returns {Promise} List of orders
   */
  getPaymentHistory: async () => {
    const res = await apiClient.get('/payments/history');
    return res.data;
  },

  /**
   * Retry failed payment
   * @param {string} orderId - Order ID to retry
   * @returns {Promise} Updated order details
   */
  retryPayment: async (orderId) => {
    const res = await apiClient.post('/payments/retry', { orderId });
    return res.data;
  },

  /**
   * Verify payment status (manual check)
   * @param {string} orderId - Order ID to verify
   * @returns {Promise} Verification result
   */
  verifyPayment: async (orderId) => {
    const res = await apiClient.post('/payments/verify', { orderId });
    return res.data;
  }
};

export default PaymentAPI;
