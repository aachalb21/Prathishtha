/**
 * User Store
 * Manages user profile and user-related data (non-auth) with Zustand
 * Complements authStore by handling user profile updates, QR codes, etc.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import UserAPI from '../Api/UserAPI';
import QRCodeAPI from '../Api/QRCodeAPI';
import ContactFormAPI from '../Api/ContactFormAPI';
import PasswordResetAPI from '../Api/PasswordResetAPI';

/**
 * User Store State Interface
 * @typedef {Object} UserState
 * @property {Object|null} userProfile - Extended user profile data
 * @property {Object|null} qrCode - User's QR code data
 * @property {string|null} qrCodeUrl - QR code image URL
 * @property {boolean} isLoading - Loading state
 * @property {string|null} error - Error message
 * @property {number|null} lastUpdated - Timestamp of last profile update
 */

const initialState = {
  userProfile: null,
  qrCode: null,
  qrCodeUrl: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const useUserStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        /**
         * Fetch current user profile from API
         */
        fetchUserProfile: async () => {
          try {
            set({ isLoading: true, error: null });

            const response = await UserAPI.getCurrentUser();

            if (response.success) {
              set({
                userProfile: response.data,
                lastUpdated: Date.now(),
                error: null,
              });
              return { success: true };
            } else {
              set({ error: response.message });
              return { success: false, error: response.message };
            }
          } catch (error) {
            const errorMsg = error.message || 'Failed to fetch user profile';
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Fetch user's QR code
         */
        fetchUserQRCode: async (userId) => {
          try {
            set({ isLoading: true, error: null });

            const response = await QRCodeAPI.getUserQRCode(userId);

            if (response.success) {
              set({
                qrCode: response.data,
                error: null,
              });
              return { success: true, data: response.data };
            } else {
              set({ error: response.message });
              return { success: false, error: response.message };
            }
          } catch (error) {
            const errorMsg = error.message || 'Failed to fetch QR code';
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Download QR code image
         */
        downloadQRCode: async (userId) => {
          try {
            set({ isLoading: true, error: null });

            const response = await QRCodeAPI.downloadUserQRCode(userId);

            if (response.success) {
              // Create blob URL for download
              const blobUrl = URL.createObjectURL(response.data);
              set({ qrCodeUrl: blobUrl, error: null });
              return { success: true, blobUrl };
            } else {
              set({ error: response.message });
              return { success: false, error: response.message };
            }
          } catch (error) {
            const errorMsg = error.message || 'Failed to download QR code';
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Regenerate user's QR code
         */
        regenerateQRCode: async (userId) => {
          try {
            set({ isLoading: true, error: null });

            const response = await QRCodeAPI.regenerateQRCode(userId);

            if (response.success) {
              set({
                qrCode: response.data,
                error: null,
              });
              return { success: true, data: response.data };
            } else {
              set({ error: response.message });
              return { success: false, error: response.message };
            }
          } catch (error) {
            const errorMsg = error.message || 'Failed to regenerate QR code';
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Verify QR code
         */
        verifyQRCode: async (qrData) => {
          try {
            set({ isLoading: true, error: null });

            const response = await QRCodeAPI.verifyQRCode(qrData);

            if (response.success) {
              return { success: true, data: response.data };
            } else {
              set({ error: response.message });
              return { success: false, error: response.message };
            }
          } catch (error) {
            const errorMsg = error.message || 'Failed to verify QR code';
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Get user profile by QR (public)
         */
        getUserProfileByQR: async (userId) => {
          try {
            set({ isLoading: true, error: null });

            const response = await QRCodeAPI.getUserProfileByQR(userId);

            if (response.success) {
              return { success: true, data: response.data };
            } else {
              set({ error: response.message });
              return { success: false, error: response.message };
            }
          } catch (error) {
            const errorMsg = error.message || 'Failed to fetch user profile';
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Submit contact form
         */
        submitContactForm: async (contactData) => {
          try {
            set({ isLoading: true, error: null });

            const response = await ContactFormAPI.submitContactForm(contactData);

            if (response.success) {
              return { success: true, data: response.data };
            } else {
              set({ error: response.message });
              return { success: false, error: response.message };
            }
          } catch (error) {
            const errorMsg = error.message || 'Failed to submit contact form';
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Get contact information
         */
        fetchContactInfo: async () => {
          try {
            set({ isLoading: true, error: null });

            const response = await ContactFormAPI.getContactInfo();

            if (response.success) {
              return { success: true, data: response.data };
            } else {
              set({ error: response.message });
              return { success: false, error: response.message };
            }
          } catch (error) {
            const errorMsg = error.message || 'Failed to fetch contact info';
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Request password reset
         */
        requestPasswordReset: async (email) => {
          try {
            set({ isLoading: true, error: null });

            const response = await PasswordResetAPI.forgotPassword(email);

            if (response.success) {
              return { success: true };
            } else {
              set({ error: response.message });
              return { success: false, error: response.message };
            }
          } catch (error) {
            const errorMsg = error.message || 'Failed to request password reset';
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Reset password with token
         */
        resetPassword: async (resetData) => {
          try {
            set({ isLoading: true, error: null });

            const response = await PasswordResetAPI.resetPassword(resetData);

            if (response.success) {
              return { success: true };
            } else {
              set({ error: response.message });
              return { success: false, error: response.message };
            }
          } catch (error) {
            const errorMsg = error.message || 'Failed to reset password';
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Verify password reset token
         */
        verifyResetToken: async (token) => {
          try {
            set({ isLoading: true, error: null });

            const response = await PasswordResetAPI.verifyResetToken(token);

            if (response.success) {
              return { success: true, data: response.data };
            } else {
              set({ error: response.message });
              return { success: false, error: response.message };
            }
          } catch (error) {
            const errorMsg = error.message || 'Failed to verify reset token';
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Set user profile locally (from auth state)
         */
        setUserProfile: (profile) => {
          set({ userProfile: profile, lastUpdated: Date.now() });
        },

        /**
         * Clear user profile data
         */
        clearUserProfile: () => {
          set({ ...initialState });
        },

        /**
         * Clear error message
         */
        clearError: () => {
          set({ error: null });
        },

        /**
         * Check if profile data needs refresh (based on age)
         */
        isProfileStale: (maxAgeMs = 300000) => {
          // Default 5 minutes
          const { lastUpdated } = get();
          if (!lastUpdated) return true;
          return Date.now() - lastUpdated > maxAgeMs;
        },
      }),
      {
        name: 'user-store', // localStorage key
        partialize: (state) => ({
          userProfile: state.userProfile,
          qrCode: state.qrCode,
        }),
        version: 1,
      }
    ),
    { name: 'User Store' } // DevTools name
  )
);
