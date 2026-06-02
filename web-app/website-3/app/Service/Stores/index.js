// Event Store Hooks
export {
  useEvents,
  useEvent,
  useEventLoading,
  useEventError,
  useEventActions,
} from './eventStore';
/**
 * Store Hooks Index
 * Central export for all Zustand stores and hooks
 */

// Stores
export { useAuthStore } from './authStore';
export { useUserStore } from './userStore';

// Auth Hooks
export {
  useUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useAuthActions,
  useTokenInfo,
  usePasswordActions as useAuthPasswordActions,
  useRequiresVerification,
  useEmailActions,
  useAuthState,
} from './useAuthHooks';

// User Hooks
export {
  useUserProfile,
  useUserQRCode,
  useUserLoading,
  useUserError,
  useProfileActions,
  useQRCodeActions,
  useContactActions,
  usePasswordActions as useUserPasswordActions,
  useUserState,
  useUserActions,
} from './useUserHooks';
