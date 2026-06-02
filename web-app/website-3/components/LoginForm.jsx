'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthActions, useAuthLoading, useAuthError, useRequiresVerification } from '@/app/Service/Stores';
import PasswordResetAPI from '@/app/Service/Api/PasswordResetAPI';
import logger from '@/utils/logger';

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuthActions();
  const isLoading = useAuthLoading();
  const error = useAuthError();
  const requiresVerification = useRequiresVerification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Forgot password modal states
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Auto-redirect to verify page when verification is required
  useEffect(() => {
    if (requiresVerification) {
      router.push('/verify');
    }
  }, [requiresVerification, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't clear previous error immediately - only clear when form fields change
    if (!email.trim()) {
      setLocalError('Please enter your email');
      setSubmitAttempted(true);
      return;
    }

    if (!password) {
      setLocalError('Please enter your password');
      setSubmitAttempted(true);
      return;
    }

    setSubmitAttempted(true);
    setLocalError(''); // Only clear for new submission attempt

    try {
      const result = await login(email.toLowerCase().trim(), password);

      if (!result.success) {
        // Keep error visible until user manually dismisses it
        setLocalError(result.error || 'Login failed. Please try again.');
        // Prevent default behavior that might cause page refresh
        return false;
      } else {
        // Only clear error on successful login
        setLocalError('');
      }
      // If successful, auto-redirect is handled by useEffect watching requiresVerification
    } catch (err) {
      setLocalError(err.message || 'Login failed. Please try again.');
      return false;
    }
    return false;
  };

  // Clear error when user starts typing
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (submitAttempted && localError) {
      setLocalError('');
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (submitAttempted && localError) {
      setLocalError('');
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!resetEmail.trim()) {
      setForgotError('Please enter your email');
      return;
    }

    setForgotLoading(true);
    try {
      logger.log('Password reset requested for:', resetEmail.toLowerCase().trim());
      const result = await PasswordResetAPI.forgotPassword(resetEmail.toLowerCase().trim());
      
      if (result.success) {
        setForgotSuccess('If an account exists with this email, you will receive a password reset link.');
      } else {
        setForgotError(result.message || 'Password reset failed. Please try again.');
      }
    } catch (err) {
      setForgotError(err.message || 'Password reset failed. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
     <div className="flex justify-center bg-black/20 items-center p-2 w-full min-h-screen py-4">
      
      <div className="w-11/12 max-w-2xl relative z-10">
        {/* Comic-style border container */}
        <div className="absolute inset-0 -z-10 bg-black transform translate-x-2 translate-y-2 -rotate-3"></div>
        <div className=" rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-yellow-100 via-red-50 to-blue-50 p-1">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="text-xl font-black comic-style-text mb-1 text-gray-900">
                LOGIN
              </div>
              <p className="text-xs text-gray-600 font-semibold">
                🎉 Campus Celebration
              </p>
            </div>

            {/* Comic callout - Error message */}
            {localError && (
              <div className="comic-callout bg-red-100 border-4 border-red-600 rounded-2xl p-4 mb-6 transform -rotate-1 flex items-center justify-between animate-pulse">
                <div className="text-red-800 font-black text-sm">
                  ⚠️ {localError}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLocalError('');
                  }}
                  className="text-red-600 hover:text-red-800 font-bold text-xl ml-4 flex-shrink-0 transition-colors"
                  title="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            {/* LOGIN FORM ONLY */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-black text-gray-900 mb-2 comic-style-text">
                  📧 EMAIL ADDRESS
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  className="w-full px-4 py-3 border-4 border-black rounded-xl font-normal text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white"
                  placeholder="your@email.com"
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-black text-gray-900 mb-2 comic-style-text">
                  🔐 PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-3 border-4 border-black rounded-xl font-normal text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white pr-12"
                    placeholder="••••••••"
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
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-linear-to-r from-red-600 to-yellow-500 text-white font-black text-lg rounded-xl border-4 border-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all transform uppercase comic-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ LOGGING IN...' : '🎉 LOGIN TO FESTIVAL'}
              </button>
            </form>

            {/* Forgot Password UI */}
            <div className="mt-4 mb-2 text-center">
              <button
                type="button"
                className="text-blue-700 font-bold underline hover:text-blue-900 comic-link"
                onClick={() => setIsForgotPassword(true)}
              >
                Forgot Password?
              </button>
            </div>

            {/* Forgot Password Modal */}
            {isForgotPassword && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-white border-4 border-black rounded-2xl p-8 w-full max-w-md relative comic-font">
                  <button
                    className="absolute top-2 right-2 text-black text-xl font-bold hover:text-red-600"
                    onClick={() => setIsForgotPassword(false)}
                  >
                    ×
                  </button>
                  <h2 className="text-2xl font-black text-black mb-4">Forgot Password</h2>
                  <form
                    onSubmit={handleForgotPasswordSubmit}
                    className="space-y-4"
                  >
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 border-4 border-black rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white"
                      required
                      disabled={forgotLoading}
                    />
                    {forgotError && (
                      <div className="text-red-600 font-bold text-sm">{forgotError}</div>
                    )}
                    {forgotSuccess && (
                      <div className="text-green-600 font-bold text-sm">{forgotSuccess}</div>
                    )}
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-2 px-4 bg-yellow-400 text-black font-black rounded-xl border-4 border-black shadow hover:bg-yellow-300 transition-all comic-button disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {forgotLoading ? '⏳ SENDING...' : 'Send Reset Link'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t-4 border-black text-center">
              <p className="text-sm text-gray-700 font-bold">
                Don&apos;t have an account?{' '}
                <Link href="/sign-up" className="text-red-600 font-medium hover:text-red-800 comic-link">
                  SIGN UP NOW!
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

        {/* Main content */}
      </div>
    </div>
  );
}
