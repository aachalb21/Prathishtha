/**
 * User API Service
 */

import apiClient from './api';

class UserAPI {
  async getCurrentUser() {
    try {
      const response = await apiClient.get('/users/me');
      const userData = response.data?.data?.user || response.data;
      return { success: true, data: userData };
    } catch (error) {
      return this._handleError(error, 'Failed to fetch current user');
    }
  }

  async getRegisteredEvents() {
    try {
      const response = await apiClient.get('/users/registered-events');
      const eventsData = response.data?.data?.registeredEvents || [];
      return { 
        success: true, 
        data: eventsData,
        count: response.data?.count || eventsData.length 
      };
    } catch (error) {
      return this._handleError(error, 'Failed to fetch registered events');
    }
  }

  async getRegisteredEventById(eventId) {
    try {
      const response = await apiClient.get(`/users/registered-events/${eventId}`);
      const eventData = response.data?.data || response.data;
      return { success: true, data: eventData };
    } catch (error) {
      return this._handleError(error, 'Failed to fetch event details');
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

export default new UserAPI();
