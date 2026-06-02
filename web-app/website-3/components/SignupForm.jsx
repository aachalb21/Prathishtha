'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthActions, useAuthLoading, useAuthError, useRequiresVerification } from '@/app/Service/Stores';

export default function SignupForm() {
  const router = useRouter();
  const { signup } = useAuthActions();
  const isLoading = useAuthLoading();
  const error = useAuthError();
  const requiresVerification = useRequiresVerification();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Auto-redirect to verify page when verification is required
  useEffect(() => {
    if (requiresVerification && !hasRedirected) {
      setHasRedirected(true);
      router.push('/verify');
    }
  }, [requiresVerification, hasRedirected, router]);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    prn: '',
    department: '',
    type: '',
    year: '',
    college_name: 'SAKEC',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep = () => {
    setLocalError('');
    
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setLocalError('Please enter your name');
        return false;
      }
      if (!formData.email.trim()) {
        setLocalError('Please enter your email');
        return false;
      }
      if (!formData.email.includes('@')) {
        setLocalError('Please enter a valid email');
        return false;
      }
      if (!formData.gender) {
        setLocalError('Please select your gender');
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.prn.trim()) {
        setLocalError('Please enter your PRN');
        return false;
      }
      if (!formData.department) {
        setLocalError('Please select your department');
        return false;
      }
      if (!formData.type) {
        setLocalError('Please select your type (B.TECH/B.VOC)');
        return false;
      }
      if (!formData.year) {
        setLocalError('Please select your year');
        return false;
      }
    }

    if (currentStep === 3) {
      if (!formData.password) {
        setLocalError('Please enter a password');
        return false;
      }
      if (formData.password.length < 6) {
        setLocalError('Password must be at least 6 characters long');
        return false;
      }
      if (!formData.confirmPassword) {
        setLocalError('Please confirm your password');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setLocalError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setLocalError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      const result = await signup(
        formData.prn,
        formData.name,
        formData.gender,
        formData.email,
        formData.password,
        formData.department,
        formData.year,
        formData.type,
        formData.college_name
      );

      // Auto-redirect is handled by useEffect watching requiresVerification
      if (!result.success) {
        setLocalError(result.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setLocalError(err.message || 'Signup failed. Please try again.');
    }
  };

  return (
   <div className="relative h-full flex justify-center items-center p-2 w-full py-4">
      
      <div className="w-11/12 max-w-2xl h-fit relative z-10">
        {/* Comic-style border container */}
        <div className="absolute inset-0 -z-10 bg-black transform translate-x-2 translate-y-2 -rotate-3"></div>
        <div className=" rounded-2xl shadow-xl ">
          <div className="bg-white p-4 sm:p-6 md:p-8 overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-base sm:text-lg md:text-xl font-normal comic-style-text mb-2 text-gray-900">
                SIGN UP
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-semimedium">
                🎉 Join Festival - Step {currentStep} of 3
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4 sm:mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2 border-2 border-black">
                <div
                  className="bg-linear-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300 border-r-2 border-black"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs font-normal text-gray-600">
                <span>Personal</span>
                <span>College Info</span>
                <span>Password</span>
              </div>
            </div>

            {/* Comic callout - Error message */}
            {(localError || error) && (
              <div className="comic-callout bg-red-100 border-4 border-red-600 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 transform -rotate-1">
                <div className="text-red-800 font-medium text-xs sm:text-sm">
                  ⚠️ {localError || error}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-3 sm:space-y-4">
              
              {/* STEP 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                  {/* Name */}
                  <div>
                      <label htmlFor="name" className="block text-[11px] sm:text-xs font-medium text-gray-900 mb-1 comic-style-text">
                      👤 NAME*
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-3 border-black rounded-lg font-normal text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-3 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white"
                      placeholder="Full name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-[11px] sm:text-xs font-medium text-gray-900 mb-1 comic-style-text">
                      📧 EMAIL*
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-3 border-black rounded-lg font-normal text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-3 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white"
                      placeholder="your.email@college.com"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label htmlFor="gender" className="block text-[11px] sm:text-xs font-medium text-gray-900 mb-1 comic-style-text">
                      ⚧️ GENDER*
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-3 border-black rounded-lg font-normal text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-3 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 2: College Info */}
              {currentStep === 2 && (
                <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                  {/* Student ID */}
                  <div>
                    <label htmlFor="prn" className="block text-[11px] sm:text-xs font-medium text-gray-900 mb-1 comic-style-text">
                      🎓 PRN*
                    </label>
                    <input
                      id="prn"
                      name="prn"
                      type="text"
                      value={formData.prn}
                      onChange={handleChange}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-3 border-black rounded-lg font-normal text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-3 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white"
                      placeholder="Student PRN"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label htmlFor="department" className="block text-[11px] sm:text-xs font-medium text-gray-900 mb-1 comic-style-text">
                      🏢 DEPARTMENT*
                    </label>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-3 border-black rounded-lg font-normal text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-3 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white"
                    >
                      <option value="">Select Department</option>
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="AIDS">AIDS</option>
                      <option value="EXTC">EXTC</option>
                      <option value="IT">IT</option>
                      <option value="ECS">ECS</option>
                      <option value="Cyber Security">Cyber Security</option>
                      <option value="ACT">ACT</option>
                      <option value="VLSI">VLSI</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label htmlFor="type" className="block text-[11px] sm:text-xs font-medium text-gray-900 mb-1 comic-style-text">
                      📚 TYPE*
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-3 border-black rounded-lg font-normal text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-3 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white"
                    >
                      <option value="">Select Type</option>
                      <option value="B.TECH">B.TECH</option>
                      <option value="B.VOC">B.VOC</option>
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label htmlFor="year" className="block text-[11px] sm:text-xs font-medium text-gray-900 mb-1 comic-style-text">
                      📅 YEAR*
                    </label>
                    <select
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-3 border-black rounded-lg font-normal text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-3 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white"
                    >
                      <option value="">Select Year</option>
                      <option value="FY">First Year (FY)</option>
                      <option value="SY">Second Year (SY)</option>
                      <option value="TY">Third Year (TY)</option>
                      <option value="Final">Final Year</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 3: Password */}
              {currentStep === 3 && (
                <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-[11px] sm:text-xs font-medium text-gray-900 mb-1 comic-style-text">
                      🔐 PASSWORD*
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-3 border-black rounded-lg font-normal text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-3 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white pr-10"
                        placeholder="Min 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.81-2.98 3.69-4.95-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm2.31-1.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-[11px] sm:text-xs font-medium text-gray-900 mb-1 comic-style-text">
                      🔐 CONFIRM PASSWORD*
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-3 border-black rounded-lg font-normal text-xs sm:text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-3 focus:ring-yellow-400 focus:border-yellow-500 transition-all comic-input bg-white pr-10"
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.81-2.98 3.69-4.95-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm2.31-1.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-2 sm:gap-3 pt-4 sm:pt-6">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 py-2 sm:py-3 px-4 bg-gray-400 hover:bg-gray-500 text-white font-black text-xs sm:text-base rounded-xl border-3 border-black shadow-lg transition-all transform active:scale-95"
                  >
                    ← BACK
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 py-2 sm:py-3 px-4 text-white font-black text-xs sm:text-base rounded-xl border-3 border-black shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    currentStep === 3
                      ? 'bg-linear-to-r from-green-600 to-emerald-500 hover:shadow-xl'
                      : 'bg-linear-to-r from-purple-600 to-pink-500 hover:shadow-xl'
                  }`}
                >
                  {isLoading ? '⏳ SIGNING UP...' : currentStep === 3 ? '🎉 SIGN UP' : 'NEXT →'}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="pt-4 sm:pt-6 text-center">
              <p className="text-xs text-gray-700 font-medium">
                Already have an account?{' '}
                <Link href="/login" className="text-red-600 font-normal hover:text-red-800 comic-link">
                  LOGIN HERE
                </Link>
              </p>
            </div>

            {/* Comic decorations */}
            <div className="absolute -top-3 -right-3 text-xl transform rotate-12 opacity-70">
              💭
            </div>
            <div className="absolute -bottom-2 -left-2 text-lg opacity-60">
              ✨
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
 