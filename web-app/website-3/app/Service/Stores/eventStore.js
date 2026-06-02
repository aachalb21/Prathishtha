// eventStore.js - Zustand store for event state
import { create } from 'zustand';
import EventAPI from '../Api/EventAPI';

export const useEventStore = create((set, get) => ({
  events: [],
  event: null,
  isLoading: false,
  error: null,

  // Actions
  fetchEventsByCategory: async (category) => {
    set({ isLoading: true, error: null });
    try {
      const response = await EventAPI.getPublicEventsByCategory(category);
      set({ events: response.events || [], isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch events', isLoading: false });
    }
  },
  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await EventAPI.getAllPublicEvents();
      set({ events: response.events || [], isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch events', isLoading: false });
    }
  },
  fetchEventBySlug: async (slug) => {
    set({ isLoading: true, error: null });
    try {
      const data = await EventAPI.getPublicEventBySlug(slug);
      // Handle both { event } and direct event object
      set({ event: data.event ? data.event : data, isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch event', isLoading: false });
    }
  },
  clearEvent: () => set({ event: null }),
  clearError: () => set({ error: null }),
}));

// Custom hooks for selectors
export const useEvents = () => useEventStore((state) => state.events);
export const useEvent = () => useEventStore((state) => state.event);
export const useEventLoading = () => useEventStore((state) => state.isLoading);
export const useEventError = () => useEventStore((state) => state.error);
export const useEventActions = () => {
  const fetchEvents = useEventStore((state) => state.fetchEvents);
  const fetchEventsByCategory = useEventStore((state) => state.fetchEventsByCategory);
  const fetchEventBySlug = useEventStore((state) => state.fetchEventBySlug);
  const clearEvent = useEventStore((state) => state.clearEvent);
  const clearError = useEventStore((state) => state.clearError);
  return { fetchEvents, fetchEventsByCategory, fetchEventBySlug, clearEvent, clearError };
};
