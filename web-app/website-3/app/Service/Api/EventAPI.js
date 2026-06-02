/**
 * Event API Service - Handles event-related API calls
 */

import apiClient from './api';

const EventAPI = {
  getAllPublicEvents: async () => {
    const res = await apiClient.get('/events/public');
    return res.data;
  },

  getPublicEventsByCategory: async (category) => {
    const res = await apiClient.get(`/events/public/category/${category}`);
    return res.data;
  },

  getPublicEventBySlug: async (slug) => {
    const res = await apiClient.get(`/events/public/slug/${slug}`);
    return res.data;
  },

  registerForEvent: async (slug, payload) => {
    const res = await apiClient.post(`/events/public/register/${slug}`, payload);
    return res.data;
  },

  joinTeam: async (token, payload) => {
    const res = await apiClient.post(`/events/public/join/${token}`, payload);
    return res.data;
  },
};

export default EventAPI;
