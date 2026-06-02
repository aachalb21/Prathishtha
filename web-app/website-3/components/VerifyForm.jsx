'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useAuthLoading, useAuthError, useEmailActions } from '@/app/Service/Stores';
import Loader from '@/components/ui/Loader';

export default function VerifyForm() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verificationStep, setVerificationStep] = useState('otp'); // 'otp' or 'resend'
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailUpdateLoading, setEmailUpdateLoading] = useState(false);
  const inputRefs = useRef([]);
  const emailInputRef = useRef(null);
  const router = useRouter();
  
  // Get user and email actions from store
  const user = useUser();
  const authError = useAuthError();
  const authLoading = useAuthLoading();
  const { verifyEmail, resendVerificationEmail, clearVerificationFlag, updateEmail } = useEmailActions();

  // Timer for resend countdown
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Focus email input when editing starts
  useEffect(() => {
    if (isEditingEmail && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [isEditingEmail]);

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    const numValue = value.replace(/[^0-9]/g, '');

    if (numValue.length > 1) {
      // If user pastes multiple digits
      const otpArray = numValue.slice(0, 6).split('');
      const newOtp = [...otp];
      otpArray.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);

      // Focus on last filled input
      const lastFilledIndex = Math.min(index + otpArray.length, 5);
      inputRefs.current[lastFilledIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = numValue;
      setOtp(newOtp);

      // Auto move to next input
      if (numValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!user || !user.email) {
      setError('User email not found. Please sign up again.');
      router.push('/sign-up');
      return;
    }

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLocalLoading(true);

    try {
      // Call verifyEmail from auth store
      const result = await verifyEmail(user.email, otpCode);
      
      if (result.success) {
        setSuccessMessage('✅ Email verified successfully! Redirecting...');
        // Clear the verification flag after successful verification
        setTimeout(() => {
          clearVerificationFlag();
          router.push('/login');
        }, 2000);
      } else {
        setError(result.error || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResendClick = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!user || !user.email) {
      setError('User email not found. Please sign up again.');
      router.push('/sign-up');
      return;
    }

    setLocalLoading(true);

    try {
      // Call resendVerificationEmail from auth store
      const result = await resendVerificationEmail(user.email);
      
      if (result.success) {
        setSuccessMessage('📧 OTP sent successfully! Check your email.');
        setOtp(['', '', '', '', '', '']);
        setResendCountdown(30);
      } else {
        setError(result.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleEditEmailClick = () => {
    setNewEmail(user?.email || '');
    setIsEditingEmail(true);
    setError('');
    setSuccessMessage('');
  };

  const handleCancelEmailEdit = () => {
    setIsEditingEmail(false);
    setNewEmail('');
    setError('');
  };

  const handleSaveEmail = async () => {
    setError('');
    setSuccessMessage('');

    // Basic validation
    if (!newEmail || !newEmail.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    const trimmedNew = newEmail.trim().toLowerCase();
    const currentEmail = user?.email?.toLowerCase();

    if (trimmedNew === currentEmail) {
      setError('New email must be different from current email.');
      return;
    }

    setEmailUpdateLoading(true);

    try {
      const result = await updateEmail(currentEmail, trimmedNew);

      if (result.success) {
        setSuccessMessage('📧 Email updated! A new OTP has been sent to your new email.');
        setIsEditingEmail(false);
        setNewEmail('');
        setOtp(['', '', '', '', '', '']);
        setResendCountdown(30);
      } else {
        setError(result.error || 'Failed to update email. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to update email. Please try again.');
    } finally {
      setEmailUpdateLoading(false);
    }
  };

  const handleBackClick = () => {
    setVerificationStep('otp');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="flex justify-center items-center p-2 w-full min-h-screen py-4">
      <div className="w-11/12 max-w-2xl relative z-10">
        {/* Comic-style border container */}
        <div className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-purple-100 via-pink-50 to-blue-50 p-1">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="text-xl font-black comic-style-text mb-1 text-gray-900">
                ✨ VERIFY YOUR EMAIL ✨
              </div>
              <p className="text-xs text-gray-600 font-semibold">
                🎉 Complete your registration
              </p>
            </div>

            {/* Comic callout - Error */}
            {error && (
              <div className="comic-callout bg-red-100 border-4 border-red-600 rounded-2xl p-4 mb-6 transform -rotate-1">
                <div className="text-red-800 font-black text-sm">
                  ⚠️ {error}
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="comic-callout bg-green-100 border-4 border-green-600 rounded-2xl p-4 mb-6 transform rotate-1">
                <div className="text-green-800 font-black text-sm">
                  {successMessage}
                </div>
              </div>
            )}

            {verificationStep === 'otp' ? (
              /* OTP VERIFICATION FORM */
              <form onSubmit={handleVerifySubmit} className="space-y-5">
                {/* Email Input with Edit capability */}
                <div>
                  <label htmlFor="email" className="block text-sm font-black text-gray-900 mb-2 comic-style-text">
                    📧 EMAIL ADDRESS
                  </label>

                  {isEditingEmail ? (
                    /* Editable email mode */
                    <div className="space-y-2">
                      <input
                        ref={emailInputRef}
                        id="email-edit"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveEmail();
                          }
                          if (e.key === 'Escape') {
                            handleCancelEmailEdit();
                          }
                        }}
                        className="w-full px-4 py-3 border-4 border-purple-500 rounded-xl font-normal text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-purple-600 transition-all comic-input bg-purple-50"
                        placeholder="Enter your correct email"
                        disabled={emailUpdateLoading}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveEmail}
                          disabled={emailUpdateLoading}
                          className="flex-1 py-2 px-4 bg-green-500 text-white font-black text-sm rounded-lg border-2 border-black hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {emailUpdateLoading ? <Loader size="sm" /> : '✅ SAVE & SEND OTP'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEmailEdit}
                          disabled={emailUpdateLoading}
                          className="py-2 px-4 bg-gray-200 text-gray-700 font-black text-sm rounded-lg border-2 border-black hover:bg-gray-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ✕ CANCEL
                        </button>
                      </div>
                      <p className="text-xs text-purple-600 font-semibold">
                        A new OTP will be sent to the updated email
                      </p>
                    </div>
                  ) : (
                    /* Read-only email with edit button */
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          id="email"
                          type="email"
                          value={user?.email || ''}
                          readOnly
                          className="flex-1 px-4 py-3 border-4 border-black rounded-xl font-normal text-gray-900 placeholder-gray-500 focus:outline-none comic-input bg-gray-100 cursor-not-allowed"
                          placeholder="your@email.com"
                        />
                        <button
                          type="button"
                          onClick={handleEditEmailClick}
                          disabled={localLoading || authLoading}
                          className="px-3 py-3 bg-yellow-400 text-black font-black text-sm rounded-xl border-4 border-black hover:bg-yellow-500 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit email address"
                        >
                          ✏️
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 font-semibold">
                        Wrong email? Click ✏️ to change it
                      </p>
                    </div>
                  )}
                </div>

                {/* OTP Input Section */}
                <div>
                  <label className="block text-sm font-black text-gray-900 mb-3 comic-style-text">
                    🔐 ENTER 6-DIGIT OTP
                  </label>
                  <p className="text-xs text-gray-600 mb-4 font-semibold">
                    Check your email for the verification code
                  </p>

                  {/* OTP Input Boxes */}
                  <div className="flex gap-2 justify-center mb-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(ref) => (inputRefs.current[index] = ref)}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-black text-lg sm:text-2xl font-black border-4 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-400 focus:border-purple-500 transition-all comic-input bg-yellow-50"
                        placeholder="0"
                        inputMode="numeric"
                      />
                    ))}
                  </div>

                  <p className="text-xs text-gray-600 text-center font-semibold">
                    Click or paste to auto-fill
                  </p>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={localLoading || authLoading || isEditingEmail}
                  className="w-full py-3 px-4 bg-linear-to-r from-purple-600 to-pink-500 text-white font-black text-lg rounded-xl border-4 border-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all transform uppercase comic-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {localLoading || authLoading ? <Loader size="sm" /> : '✅ VERIFY EMAIL'}
                </button>

                {/* Resend OTP Section */}
                <div className="text-center pt-4 border-t-4 border-black">
                  <p className="text-xs text-gray-700 font-semibold mb-3">
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendClick}
                    disabled={resendCountdown > 0 || localLoading || authLoading}
                    className="text-purple-600 font-black hover:text-purple-800 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {resendCountdown > 0 ? (
                      `RESEND IN ${resendCountdown}s`
                    ) : (
                      '📧 RESEND OTP'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* BACKUP VERIFICATION FORM */
              <form onSubmit={handleVerifySubmit} className="space-y-5">
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-700 font-semibold mb-4">
                    Use your backup verification method
                  </p>
                </div>

                {/* Phone Verification Option */}
                <div className="p-4 border-4 border-blue-600 rounded-xl bg-blue-50">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">📱</span>
                    <p className="font-black text-gray-900">Phone Verification</p>
                  </div>
                  <p className="text-xs text-gray-700 mb-3 font-semibold">
                    We&apos;ll send a code to your registered phone number
                  </p>
                  <button
                    type="button"
                    className="w-full py-2 px-4 bg-blue-600 text-white font-black rounded-lg border-2 border-black hover:bg-blue-700 transition-all"
                  >
                    📱 VERIFY WITH PHONE
                  </button>
                </div>

                {/* Back to OTP */}
                <button
                  type="button"
                  onClick={handleBackClick}
                  className="w-full py-2 px-4 text-gray-700 font-black text-sm border-2 border-gray-400 rounded-xl hover:bg-gray-100 transition-all"
                >
                  ← BACK TO OTP
                </button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t-4 border-black text-center">
              <p className="text-sm text-gray-700 font-bold">
                Having trouble?{' '}
                <Link href="/login" className="text-purple-600 font-black hover:text-purple-800 comic-link">
                  BACK TO LOGIN
                </Link>
              </p>
            </div>

            {/* Comic decorations */}
            <div className="absolute -top-3 -right-3 text-2xl transform rotate-12 opacity-70">
              💌
            </div>
            <div className="absolute -bottom-2 -left-2 text-xl opacity-60">
              ⚡
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
