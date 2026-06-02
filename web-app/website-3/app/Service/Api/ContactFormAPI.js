/**
 * Contact Form API Service
 */

import apiClient from './api';

class ContactFormAPI {
  async submitContactForm(contactData) {
    try {
      const payload = {
        name: contactData.name,
        email: contactData.email,
        subject: contactData.subject,
        message: contactData.message,
      };
      if (contactData.phone) payload.phone = contactData.phone;

      const response = await apiClient.post('/users/contact', payload);
      return { success: true, data: response.data };
    } catch (error) {
      return this._handleError(error, 'Failed to submit contact form');
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

export default new ContactFormAPI();
