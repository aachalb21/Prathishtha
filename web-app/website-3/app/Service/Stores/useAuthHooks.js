/**
 * Custom Hooks for Auth Store
 * Extracted hooks for cleaner component usage
 */

import { useAuthStore } from './authStore';

/**
 * Get current user
 */
export const useUser = () => {
  return useAuthStore((state) => state.user);
};

/**
 * Check if authenticated
 */
export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.isAuthenticated);
};

/**
 * Get loading state
 */
export const useAuthLoading = () => {
  return useAuthStore((state) => state.isLoading);
};

/**
 * Get error message
 */
export const useAuthError = () => {
  return useAuthStore((state) => state.error);
};

/**
 * Get auth actions
 */
export const useAuthActions = () => {
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);
  const logout = useAuthStore((state) => state.logout);
  const clearError = useAuthStore((state) => state.clearError);
  const refreshAccessToken = useAuthStore((state) => state.refreshAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  return {
    login,
    signup,
    logout,
    clearError,
    refreshAccessToken,
    setUser,
  };
};

/**
 * Get token info
 */
export const useTokenInfo = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const tokenExpiry = useAuthStore((state) => state.tokenExpiry);
  const isTokenExpired = useAuthStore((state) => state.isTokenExpired());
  const remainingTime = useAuthStore((state) => state.getTokenRemainingTime());

  return {
    accessToken,
    refreshToken,
    tokenExpiry,
    isTokenExpired,
    remainingTime,
  };
};

/**
 * Get password reset actions
 */
export const usePasswordActions = () => {
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const changePassword = useAuthStore((state) => state.changePassword);

  return {
    requestPasswordReset,
    resetPassword,
    changePassword,
  };
};

/**
 * Check if email verification is required
 */
export const useRequiresVerification = () => {
  return useAuthStore((state) => state.requiresVerification);
};

/**
 * Get email verification actions
 */
export const useEmailActions = () => {
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const resendVerificationEmail = useAuthStore((state) => state.resendVerificationEmail);
  const clearVerificationFlag = useAuthStore((state) => state.clearVerificationFlag);
  const updateEmail = useAuthStore((state) => state.updateEmail);

  return {
    verifyEmail,
    resendVerificationEmail,
    clearVerificationFlag,
    updateEmail,
  };
};

/**
 * Get full auth state
 */
export const useAuthState = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const accessToken = useAuthStore((state) => state.accessToken);
  const requiresVerification = useAuthStore((state) => state.requiresVerification);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    accessToken,
    requiresVerification,
  };
};
