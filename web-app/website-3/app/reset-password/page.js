'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PasswordResetAPI from '@/app/Service/Api/PasswordResetAPI';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid or missing reset token. Please request a new password reset link.');
        setIsVerifying(false);
        return;
      }

      try {
        const result = await PasswordResetAPI.verifyResetToken(token);
        if (result.success) {
          setTokenValid(true);
        } else {
          setError(result.message || 'Invalid or expired reset token.');
        }
      } catch (err) {
        setError(err.message || 'Invalid or expired reset token. Please request a new password reset link.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password) {
      setError('Please enter a new password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await PasswordResetAPI.resetPassword({
        token,
        password,
        confirmPassword
      });

      if (result.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(result.message || 'Password reset failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while verifying token
  if (isVerifying) {
    return (
      <div className="flex justify-center bg-black/20 items-center p-2 w-full min-h-screen py-4">
        <div className="w-11/12 max-w-2xl relative z-10">
          <div className="absolute inset-0 -z-10 bg-black transform translate-x-2 translate-y-2 -rotate-3"></div>
          <div className="rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-yellow-100 via-red-50 to-blue-50 p-1">
            <div className="bg-white rounded-2xl p-6 sm:p-8 text-center">
              <div className="text-xl font-black comic-style-text mb-4 text-gray-900">
                ⏳ VERIFYING...
              </div>
              <p className="text-gray-600">Please wait while we verify your reset link.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex justify-center bg-black/20 items-center p-2 w-full min-h-screen py-4">
        <div className="w-11/12 max-w-2xl relative z-10">
          <div className="absolute inset-0 -z-10 bg-black transform translate-x-2 translate-y-2 -rotate-3"></div>
          <div className="rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-yellow-100 via-red-50 to-blue-50 p-1">
            <div className="bg-white rounded-2xl p-6 sm:p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <div className="text-xl font-black comic-style-text mb-4 text-green-600">
                PASSWORD RESET SUCCESSFUL!
              </div>
              <p className="text-gray-600 mb-4">
                Your password has been changed successfully. Redirecting to login...
              </p>
              <Link
                href="/login"
                className="inline-block py-3 px-6 bg-linear-to-r from-red-600 to-yellow-500 text-white font-black text-lg rounded-xl border-4 border-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all transform uppercase comic-button"
              >
                GO TO LOGIN
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid && !isVerifying) {
    return (
      <div className="flex justify-center bg-black/20 items-center p-2 w-full min-h-screen py-4">
        <div className="w-11/12 max-w-2xl relative z-10">
          <div className="absolute inset-0 -z-10 bg-black transform translate-x-2 translate-y-2 -rotate-3"></div>
          <div className="rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-yellow-100 via-red-50 to-blue-50 p-1">
            <div className="bg-white rounded-2xl p-6 sm:p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <div className="text-xl font-black comic-style-text mb-4 text-red-600">
                INVALID RESET LINK
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Link
                href="/login"
                className="inline-block py-3 px-6 bg-linear-to-r from-red-600 to-yellow-500 text-white font-black text-lg rounded-xl border-4 border-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all transform uppercase comic-button"
              >
                BACK TO LOGIN
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="flex justify-center bg-black/20 items-center p-2 w-full min-h-screen py-4">
      <div className="w-11/12 max-w-2xl relative z-10">
        {/* Comic-style border container */}
        <div className="absolute inset-0 -z-10 bg-black transform translate-x-2 translate-y-2 -rotate-3"></div>
        <div className="rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-yellow-100 via-red-50 to-blue-50 p-1">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-xl font-black comic-style-text mb-1 text-gray-900">
                🔐 RESET PASSWORD
              </div>
              <p className="text-xs text-gray-600 font-semibold">
                Create your new password
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="comic-callout bg-red-100 border-4 border-red-600 rounded-2xl p-4 mb-6 transform -rotate-1">
                <div className="text-red-800 font-black text-sm">
                  ⚠️ {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-black text-gray-900 mb-2 comic-style-text">
                  🔑 NEW PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-4 border-black rounded-xl font-normal text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white pr-12"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.81-2.98 3.69-4.95-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm2.31-1.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-black text-gray-900 mb-2 comic-style-text">
                  🔑 CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-4 border-black rounded-xl font-normal text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white pr-12"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.81-2.98 3.69-4.95-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm2.31-1.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-linear-to-r from-red-600 to-yellow-500 text-white font-black text-lg rounded-xl border-4 border-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all transform uppercase comic-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ RESETTING...' : '🔐 RESET PASSWORD'}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t-4 border-black text-center">
              <p className="text-sm text-gray-700 font-bold">
                Remember your password?{' '}
                <Link href="/login" className="text-red-600 font-medium hover:text-red-800 comic-link">
                  LOGIN NOW!
                </Link>
              </p>
            </div>

            {/* Comic decorations */}
            <div className="absolute -top-3 -right-3 text-2xl transform rotate-12 opacity-70">
              💭
            </div>
            <div className="absolute -bottom-2 -left-2 text-xl opacity-60">
              ✨
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center bg-black/20 items-center p-2 w-full min-h-screen py-4">
        <div className="text-xl font-black text-white">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
