/**
 * Gallery API Service - Handles photo gallery API calls
 */

import apiClient from './api';

class GalleryAPI {
  async getGalleryPhotos(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.eventCategory && filters.eventCategory !== 'all') {
        queryParams.append('eventCategory', filters.eventCategory);
      }
      if (filters.year) queryParams.append('year', filters.year);
      if (filters.eventName) queryParams.append('eventName', filters.eventName);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await apiClient.get(`/photographer/gallery?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data?.photos || [],
        pagination: response.data?.pagination || {},
        filters: response.data?.filters || {},
      };
    } catch (error) {
      return this._handleError(error, 'Failed to fetch gallery photos');
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
      errorResponse.message = error.message;
    }
    return errorResponse;
  }
}

export default new GalleryAPI();
