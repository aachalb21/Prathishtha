'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useIsAuthenticated, useRequiresVerification, useAuthLoading } from '@/app/Service/Stores';
import { checkAuthWithBackend, ensureTokenInHeaders } from '@/app/Service/Auth/authUtils';
import logger from '@/utils/logger';

/**
 * Protected Route Component
 * Verifies access token with backend checkAuth middleware
 * 
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {string} requiredAuth - 'none' | 'auth' | 'verified'
 *   - 'none': Anyone can access
 *   - 'auth': Must be authenticated (isAuthenticated = true), allows users awaiting verification
 *   - 'verified': Must be authenticated AND verified (not requiring verification)
 */
export default function ProtectedRoute({ children, requiredAuth = 'auth' }) {
  const isAuthenticated = useIsAuthenticated();
  const requiresVerification = useRequiresVerification();
  const isLoading = useAuthLoading();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        setIsVerifying(true);

        // Special case: User awaiting email verification
        // They are authenticated in the sense that they have completed signup
        // and can access the verification page
        if (requiresVerification && !isLoading) {
          if (requiredAuth === 'auth') {
            // Verification page requires 'auth' mode which includes unverified users
            setIsAuthorized(true);
            return;
          } else if (requiredAuth === 'verified') {
            // Verified pages cannot be accessed by unverified users
            setIsAuthorized(false);
            router.push('/verify');
            return;
          }
        }

        // Ensure token is in axios headers
        ensureTokenInHeaders();

        // Verify token with backend checkAuth middleware
        const accessCheck = await checkAuthWithBackend(isAuthenticated, isLoading, requiredAuth);

        // Check result
        if (accessCheck.loading) {
          setIsAuthorized(false);
          return;
        }

        // Check if token is valid
        if (!accessCheck.tokenValid) {
          setIsAuthorized(false);

          if (accessCheck.redirectTo) {
            router.push(accessCheck.redirectTo);
          }
          return;
        }

        // Token is valid and authorized
        if (accessCheck.authorized) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);

          if (accessCheck.redirectTo) {
            router.push(accessCheck.redirectTo);
          }
        }
      } catch (error) {
        logger.error('Route access verification error:', error);
        setIsAuthorized(false);
        router.push('/login');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAccess();
  }, [isAuthenticated, isLoading, requiresVerification, requiredAuth, router]);

  // Show loading state while checking auth
  if (isLoading || isVerifying) {
    return (
      <div className="flex justify-center items-center w-full min-h-screen">
        <div className="text-center">
          <div className="text-3xl font-black mb-4">🎉</div>
          <p className="font-bold text-gray-700">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If not authorized, don't render children
  if (!isAuthorized) {
    return null;
  }

  return children;
}
