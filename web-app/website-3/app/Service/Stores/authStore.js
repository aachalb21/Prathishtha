/**
 * Auth Store
 * Manages authentication state with Zustand
 * Production-ready with middleware, persistence, and actions
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import TokenManager from "../Api/TokenManager";
import AuthAPI from "../Api/AuthAPI";
import { setAuthToken } from "../Api/api";
import { useUserStore } from "./userStore";
import logger from "../../../utils/logger";

/**
 * Auth Store State Interface
 * @typedef {Object} AuthState
 * @property {Object|null} user - Current logged-in user
 * @property {string|null} accessToken - JWT access token
 * @property {string|null} refreshToken - JWT refresh token
 * @property {boolean} isAuthenticated - Authentication status
 * @property {boolean} isLoading - Loading state
 * @property {string|null} error - Error message
 * @property {number|null} tokenExpiry - Token expiry timestamp
 * @property {boolean} requiresVerification - Whether user needs email verification
 */

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  tokenExpiry: null,
  requiresVerification: false,
};

export const useAuthStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

        /**
         * Initialize auth state from TokenManager on app load
         */
        initializeAuth: async () => {
          try {
            set({ isLoading: true });

            const accessToken = TokenManager.getAccessToken();
            const refreshToken = TokenManager.getRefreshToken();
            
            // Check if user is awaiting email verification (no tokens yet)
            const pendingVerificationUser = localStorage.getItem('pending_verification_user');
            const pendingVerificationEmail = localStorage.getItem('pending_verification_email');

            if (pendingVerificationUser && pendingVerificationEmail) {
              // User is awaiting verification, restore that state
              try {
                const user = JSON.parse(pendingVerificationUser);
                set({
                  user,
                  requiresVerification: true,
                  isAuthenticated: false,
                  accessToken: null,
                  refreshToken: null,
                  error: null,
                });
                return;
              } catch (err) {
                logger.error("Failed to restore pending verification state:", err);
              }
            }

            if (accessToken && refreshToken) {
              // Set auth token in axios headers
              setAuthToken(accessToken);

              // Verify token by fetching user
              const response = await AuthAPI.getCurrentUser();

              if (response.success) {
                set({
                  user: response.data.user || response.data,
                  accessToken,
                  refreshToken,
                  isAuthenticated: true,
                  requiresVerification: false,
                  error: null,
                });
              } else {
                // Token invalid, clear state
                set({ ...initialState });
                TokenManager.clearTokens();
                setAuthToken(null);
              }
            } else {
              // No tokens and no pending verification
              set({ ...initialState });
            }
          } catch (error) {
            logger.error("Auth initialization failed:", error);
            set({ ...initialState });
            TokenManager.clearTokens();
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Login user
         */
        login: async (email, password) => {
          try {
            set({ isLoading: true, error: null });

            // Clear any old user data from userStore before login
            useUserStore.getState().clearUserProfile();

            const response = await AuthAPI.login({
              email,
              password,
            });

            if (response.success) {
              const { accessToken, refreshToken, expiresIn, user, requiresVerification } = response.data;

              // If verification is required, set tokens and user but mark as unverified
              if (requiresVerification) {
                TokenManager.setTokens(accessToken, refreshToken, expiresIn);
                setAuthToken(accessToken);

                // Store pending verification state
                localStorage.setItem('pending_verification_user', JSON.stringify(user));
                localStorage.setItem('pending_verification_email', user.email);

                set({
                  user,
                  accessToken,
                  refreshToken,
                  isAuthenticated: false,
                  requiresVerification: true,
                  tokenExpiry: Date.now() + expiresIn * 1000,
                  error: null,
                });

                return { 
                  success: true, 
                  requiresVerification: true,
                  user 
                };
              } else {
                // User is fully verified
                TokenManager.setTokens(accessToken, refreshToken, expiresIn);
                setAuthToken(accessToken);

                // Clear pending verification if exists
                localStorage.removeItem('pending_verification_user');
                localStorage.removeItem('pending_verification_email');

                set({
                  user,
                  accessToken,
                  refreshToken,
                  isAuthenticated: true,
                  requiresVerification: false,
                  tokenExpiry: Date.now() + expiresIn * 1000,
                  error: null,
                });

                return { success: true, requiresVerification: false };
              }
            } else {
              set({ error: response.error });
              return { success: false, error: response.error };
            }
          } catch (error) {
            const errorMsg = error.message || "Login failed";
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Sign up user
         */
        signup: async (
          prn,
          name,
          gender,
          email,
          password,
          department,
          year,
          type,
          college_name
        ) => {
          try {
            set({ isLoading: true, error: null });

            // Clear any old user data from userStore before signup
            useUserStore.getState().clearUserProfile();

            const response = await AuthAPI.signup({
              prn,
              name,
              gender,
              email,
              password,
              department,
              year,
              type,
              college_name,
            });

            if (response.success) {
              const { user, requiresVerification } = response.data;

              // If verification is required, set user and flag without tokens
              if (requiresVerification) {
                // Store pending verification state in localStorage for persistence
                localStorage.setItem('pending_verification_user', JSON.stringify(user));
                localStorage.setItem('pending_verification_email', user.email);
                
                set({
                  user,
                  requiresVerification: true,
                  isAuthenticated: false,
                  accessToken: null,
                  refreshToken: null,
                  error: null,
                });
                return {
                  success: true,
                  requiresVerification: true,
                  user,
                };
              } else {
                // If no verification needed, treat like successful login
                const { accessToken, refreshToken, expiresIn } = response.data;

                if (accessToken && refreshToken) {
                  TokenManager.setTokens(accessToken, refreshToken, expiresIn);
                  setAuthToken(accessToken);

                  // Clear pending verification if exists
                  localStorage.removeItem('pending_verification_user');
                  localStorage.removeItem('pending_verification_email');

                  set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    requiresVerification: false,
                    tokenExpiry: Date.now() + expiresIn * 1000,
                    error: null,
                  });

                  return { success: true, requiresVerification: false };
                } else {
                  // No verification required and no tokens (shouldn't happen normally)
                  set({
                    user,
                    isAuthenticated: false,
                    requiresVerification: false,
                    error: null,
                  });
                  return { success: true, requiresVerification: false, user };
                }
              }
            } else {
              set({ error: response.error });
              return { success: false, error: response.error };
            }
          } catch (error) {
            const errorMsg = error.message || "Signup failed";
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Logout user
         */
        logout: async () => {
          try {
            const { refreshToken } = get();

            // Notify backend
            if (refreshToken) {
              await AuthAPI.logout(refreshToken);
            }
          } catch (error) {
            logger.warn("Logout notification failed:", error);
          } finally {
            // Clear all auth-related localStorage items
            localStorage.removeItem('pending_verification_user');
            localStorage.removeItem('pending_verification_email');
            localStorage.removeItem('isAuth');
            localStorage.removeItem('isVerified');
            localStorage.removeItem('verificationEmail');
            
            // Clear tokens from TokenManager (clears auth_access_token, auth_refresh_token, auth_token_expiry)
            TokenManager.clearTokens();
            
            // Clear auth token from axios headers
            setAuthToken(null);
            
            // Clear user data from userStore
            useUserStore.getState().clearUserProfile();
            
            // Reset Zustand store to initial state
            set({ ...initialState });
          }
        },

        /**
         * Refresh access token
         */
        refreshAccessToken: async () => {
          try {
            const { refreshToken } = get();

            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            const response = await AuthAPI.refreshToken(refreshToken);

            if (response.success) {
              const { accessToken, expiresIn } = response.data;

              TokenManager.updateAccessToken(accessToken, expiresIn);

              set({
                accessToken,
                tokenExpiry: Date.now() + expiresIn * 1000,
              });

              return { success: true };
            } else {
              // Refresh failed, logout user
              set({ ...initialState });
              TokenManager.clearTokens();
              return { success: false, error: response.error };
            }
          } catch (error) {
            set({ ...initialState });
            TokenManager.clearTokens();
            return { success: false, error: error.message };
          }
        },

        /**
         * Update user profile locally
         */
        setUser: (user) => {
          set({ user });
        },

        /**
         * Clear error message
         */
        clearError: () => {
          set({ error: null });
        },

        /**
         * Check if token is expired
         */
        isTokenExpired: () => {
          const { tokenExpiry } = get();
          if (!tokenExpiry) return true;
          return Date.now() >= tokenExpiry;
        },

        /**
         * Get remaining token time in seconds
         */
        getTokenRemainingTime: () => {
          const { tokenExpiry } = get();
          if (!tokenExpiry) return 0;
          return Math.max(0, Math.floor((tokenExpiry - Date.now()) / 1000));
        },

        /**
         * Request password reset
         */
        requestPasswordReset: async (email) => {
          try {
            set({ isLoading: true, error: null });

            const response = await AuthAPI.requestPasswordReset(email);

            if (response.success) {
              return { success: true };
            } else {
              set({ error: response.error });
              return { success: false, error: response.error };
            }
          } catch (error) {
            const errorMsg = error.message || "Password reset request failed";
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Reset password
         */
        resetPassword: async (token, newPassword) => {
          try {
            set({ isLoading: true, error: null });

            const response = await AuthAPI.resetPassword({
              token,
              newPassword,
            });

            if (response.success) {
              return { success: true };
            } else {
              set({ error: response.error });
              return { success: false, error: response.error };
            }
          } catch (error) {
            const errorMsg = error.message || "Password reset failed";
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Change password
         */
        changePassword: async (currentPassword, newPassword) => {
          try {
            set({ isLoading: true, error: null });

            const response = await AuthAPI.changePassword({
              currentPassword,
              newPassword,
            });

            if (response.success) {
              return { success: true };
            } else {
              set({ error: response.error });
              return { success: false, error: response.error };
            }
          } catch (error) {
            const errorMsg = error.message || "Password change failed";
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Verify email with OTP
         */
        verifyEmail: async (email, otp) => {
          try {
            set({ isLoading: true, error: null });

            const response = await AuthAPI.verifyEmail(email, otp);

            if (response.success) {
              const { accessToken, refreshToken, expiresIn, user } = response.data;

              // Update tokens and mark as verified
              TokenManager.setTokens(accessToken, refreshToken, expiresIn);
              setAuthToken(accessToken);

              // Clear pending verification from localStorage
              localStorage.removeItem('pending_verification_user');
              localStorage.removeItem('pending_verification_email');

              set({
                user,
                accessToken,
                refreshToken,
                requiresVerification: false,
                tokenExpiry: Date.now() + expiresIn * 1000,
                error: null,
              });

              return { success: true };
            } else {
              set({ error: response.error });
              return { success: false, error: response.error };
            }
          } catch (error) {
            const errorMsg = error.message || "Email verification failed";
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Resend OTP to email
         */
        resendVerificationEmail: async (email) => {
          try {
            set({ isLoading: true, error: null });

            const response = await AuthAPI.resendOTP(email);

            if (response.success) {
              return { success: true };
            } else {
              set({ error: response.error });
              return { success: false, error: response.error };
            }
          } catch (error) {
            const errorMsg = error.message || "Failed to resend OTP";
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Update email for unverified user (during verification)
         */
        updateEmail: async (oldEmail, newEmail) => {
          try {
            set({ isLoading: true, error: null });

            const response = await AuthAPI.updateEmail(oldEmail, newEmail);

            if (response.success) {
              // Update user email in store
              const currentUser = get().user;
              const updatedUser = { ...currentUser, email: newEmail };

              // Update localStorage
              localStorage.setItem('pending_verification_user', JSON.stringify(updatedUser));
              localStorage.setItem('pending_verification_email', newEmail);

              set({ user: updatedUser });

              return { success: true };
            } else {
              set({ error: response.error });
              return { success: false, error: response.error };
            }
          } catch (error) {
            const errorMsg = error.message || 'Failed to update email';
            set({ error: errorMsg });
            return { success: false, error: errorMsg };
          } finally {
            set({ isLoading: false });
          }
        },

        /**
         * Clear verification flag (after successful verification)
         */
        clearVerificationFlag: () => {
          localStorage.removeItem('pending_verification_user');
          localStorage.removeItem('pending_verification_email');
          set({ requiresVerification: false });
        },

        /**
         * Clear error message
         */
        clearError: () => {
          set({ error: null });
        },
      }),
    { name: "Auth Store" } // DevTools name
  )
);
