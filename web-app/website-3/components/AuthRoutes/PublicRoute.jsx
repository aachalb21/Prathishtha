'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useIsAuthenticated, useRequiresVerification, useAuthLoading } from '@/app/Service/Stores';
import { checkPublicRouteAccess, ensureTokenInHeaders } from '@/app/Service/Auth/authUtils';

/**
 * Public Route Component
 * Uses checkAuth utility for consistent access checking on public pages
 * 
 * Rules:
 * - If fully authenticated and verified: redirect to dashboard
 * - If authenticated but needs verification: allow access (can access /verify or /login/signup)
 * - If not authenticated: allow access to public pages
 */
export default function PublicRoute({ children }) {
  const isAuthenticated = useIsAuthenticated();
  const requiresVerification = useRequiresVerification();
  const isLoading = useAuthLoading();
  const router = useRouter();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    // Ensure token is in axios headers if it exists
    ensureTokenInHeaders();

    // Use checkPublicRouteAccess utility for consistent auth checking
    const accessCheck = checkPublicRouteAccess(isAuthenticated, requiresVerification, isLoading);

    // Still loading, don't render yet
    if (!accessCheck.canRender && accessCheck.redirectTo === null && isLoading) {
      setCanRender(false);
      return;
    }

    // Check if should redirect
    if (accessCheck.shouldRedirect && accessCheck.redirectTo) {
      router.push(accessCheck.redirectTo);
      setCanRender(false);
      return;
    }

    // Can render
    setCanRender(accessCheck.canRender);
  }, [isAuthenticated, requiresVerification, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full min-h-screen">
        <div className="text-center">
          <div className="text-3xl font-black mb-4">🎉</div>
          <p className="font-bold text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canRender) {
    return null;
  }

  return children;
}
