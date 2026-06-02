/**
 * Custom Hooks for User Store
 * Extracted hooks for cleaner component usage
 */

import { useCallback, useMemo } from 'react';
import { useUserStore } from './userStore';

// Individual memoized selectors
const selectUserProfile = (state) => state.userProfile;
const selectQRCodeData = (state) => state.qrCode;
const selectQRCodeUrl = (state) => state.qrCodeUrl;
const selectUserLoading = (state) => state.isLoading;
const selectUserError = (state) => state.error;
const selectFetchUserProfile = (state) => state.fetchUserProfile;
const selectSetUserProfile = (state) => state.setUserProfile;
const selectClearUserProfile = (state) => state.clearUserProfile;
const selectIsProfileStale = (state) => state.isProfileStale;
const selectFetchUserQRCode = (state) => state.fetchUserQRCode;
const selectDownloadQRCode = (state) => state.downloadQRCode;
const selectRegenerateQRCode = (state) => state.regenerateQRCode;
const selectVerifyQRCode = (state) => state.verifyQRCode;
const selectGetUserProfileByQR = (state) => state.getUserProfileByQR;
const selectSubmitContactForm = (state) => state.submitContactForm;
const selectFetchContactInfo = (state) => state.fetchContactInfo;
const selectRequestPasswordReset = (state) => state.requestPasswordReset;
const selectResetPassword = (state) => state.resetPassword;
const selectVerifyResetToken = (state) => state.verifyResetToken;
const selectLastUpdated = (state) => state.lastUpdated;
const selectClearError = (state) => state.clearError;

/**
 * Get user profile
 */
export const useUserProfile = () => {
  return useUserStore(selectUserProfile);
};

/**
 * Get QR code data
 */
export const useUserQRCode = () => {
  const qrCode = useUserStore(selectQRCodeData);
  const qrCodeUrl = useUserStore(selectQRCodeUrl);
  return useMemo(() => ({ qrCode, qrCodeUrl }), [qrCode, qrCodeUrl]);
};

/**
 * Get loading state
 */
export const useUserLoading = () => {
  return useUserStore(selectUserLoading);
};

/**
 * Get error message
 */
export const useUserError = () => {
  return useUserStore(selectUserError);
};

/**
 * Get profile fetch actions
 */
export const useProfileActions = () => {
  const fetchUserProfile = useUserStore(selectFetchUserProfile);
  const setUserProfile = useUserStore(selectSetUserProfile);
  const clearUserProfile = useUserStore(selectClearUserProfile);
  const isProfileStale = useUserStore(selectIsProfileStale);
  
  return useMemo(
    () => ({
      fetchUserProfile,
      setUserProfile,
      clearUserProfile,
      isProfileStale,
    }),
    [fetchUserProfile, setUserProfile, clearUserProfile, isProfileStale]
  );
};

/**
 * Get QR code actions
 */
export const useQRCodeActions = () => {
  const fetchUserQRCode = useUserStore(selectFetchUserQRCode);
  const downloadQRCode = useUserStore(selectDownloadQRCode);
  const regenerateQRCode = useUserStore(selectRegenerateQRCode);
  const verifyQRCode = useUserStore(selectVerifyQRCode);
  const getUserProfileByQR = useUserStore(selectGetUserProfileByQR);
  
  return useMemo(
    () => ({
      fetchUserQRCode,
      downloadQRCode,
      regenerateQRCode,
      verifyQRCode,
      getUserProfileByQR,
    }),
    [fetchUserQRCode, downloadQRCode, regenerateQRCode, verifyQRCode, getUserProfileByQR]
  );
};

/**
 * Get contact form actions
 */
export const useContactActions = () => {
  const submitContactForm = useUserStore(selectSubmitContactForm);
  const fetchContactInfo = useUserStore(selectFetchContactInfo);
  
  return useMemo(
    () => ({
      submitContactForm,
      fetchContactInfo,
    }),
    [submitContactForm, fetchContactInfo]
  );
};

/**
 * Get password actions
 */
export const usePasswordActions = () => {
  const requestPasswordReset = useUserStore(selectRequestPasswordReset);
  const resetPassword = useUserStore(selectResetPassword);
  const verifyResetToken = useUserStore(selectVerifyResetToken);
  
  return useMemo(
    () => ({
      requestPasswordReset,
      resetPassword,
      verifyResetToken,
    }),
    [requestPasswordReset, resetPassword, verifyResetToken]
  );
};

/**
 * Get full user state
 */
export const useUserState = () => {
  const userProfile = useUserStore(selectUserProfile);
  const qrCode = useUserStore(selectQRCodeData);
  const qrCodeUrl = useUserStore(selectQRCodeUrl);
  const isLoading = useUserStore(selectUserLoading);
  const error = useUserStore(selectUserError);
  const lastUpdated = useUserStore(selectLastUpdated);
  
  return useMemo(
    () => ({
      userProfile,
      qrCode,
      qrCodeUrl,
      isLoading,
      error,
      lastUpdated,
    }),
    [userProfile, qrCode, qrCodeUrl, isLoading, error, lastUpdated]
  );
};

/**
 * Get user actions (all user-related actions)
 */
export const useUserActions = () => {
  const fetchUserProfile = useUserStore(selectFetchUserProfile);
  const fetchUserQRCode = useUserStore(selectFetchUserQRCode);
  const downloadQRCode = useUserStore(selectDownloadQRCode);
  const regenerateQRCode = useUserStore(selectRegenerateQRCode);
  const verifyQRCode = useUserStore(selectVerifyQRCode);
  const getUserProfileByQR = useUserStore(selectGetUserProfileByQR);
  const submitContactForm = useUserStore(selectSubmitContactForm);
  const fetchContactInfo = useUserStore(selectFetchContactInfo);
  const requestPasswordReset = useUserStore(selectRequestPasswordReset);
  const resetPassword = useUserStore(selectResetPassword);
  const verifyResetToken = useUserStore(selectVerifyResetToken);
  const setUserProfile = useUserStore(selectSetUserProfile);
  const clearUserProfile = useUserStore(selectClearUserProfile);
  const clearError = useUserStore(selectClearError);
  
  return useMemo(
    () => ({
      fetchUserProfile,
      fetchUserQRCode,
      downloadQRCode,
      regenerateQRCode,
      verifyQRCode,
      getUserProfileByQR,
      submitContactForm,
      fetchContactInfo,
      requestPasswordReset,
      resetPassword,
      verifyResetToken,
      setUserProfile,
      clearUserProfile,
      clearError,
    }),
    [
      fetchUserProfile,
      fetchUserQRCode,
      downloadQRCode,
      regenerateQRCode,
      verifyQRCode,
      getUserProfileByQR,
      submitContactForm,
      fetchContactInfo,
      requestPasswordReset,
      resetPassword,
      verifyResetToken,
      setUserProfile,
      clearUserProfile,
      clearError,
    ]
  );
};
