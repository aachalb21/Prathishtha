'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '@/app/Service/Stores';
import { initializeAuthOnStartup, ensureTokenInHeaders } from '@/app/Service/Auth/authUtils';
import logger from '@/utils/logger';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage and Zustand
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Ensure token is in axios headers
        ensureTokenInHeaders();

        // Initialize Zustand auth store
        const { initializeAuth: zustandInit } = useAuthStore.getState();
        await zustandInit();

        // Load legacy auth context from localStorage
        const storedAuth = localStorage.getItem('isAuth');
        const storedVerified = localStorage.getItem('isVerified');
        const storedEmail = localStorage.getItem('verificationEmail');

        if (storedAuth) {
          setIsAuth(JSON.parse(storedAuth));
        }
        if (storedVerified) {
          setIsVerified(JSON.parse(storedVerified));
        }
        if (storedEmail) {
          setVerificationEmail(storedEmail);
        }
      } catch (error) {
        logger.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('isAuth', JSON.stringify(isAuth));
  }, [isAuth]);

  useEffect(() => {
    localStorage.setItem('isVerified', JSON.stringify(isVerified));
  }, [isVerified]);

  useEffect(() => {
    localStorage.setItem('verificationEmail', verificationEmail);
  }, [verificationEmail]);

  const logout = () => {
    // Clear legacy AuthContext state
    setIsAuth(false);
    setIsVerified(false);
    setVerificationEmail('');
    
    // Logout from Zustand store (this will clear all auth states)
    const { logout: zustandLogout } = useAuthStore.getState();
    zustandLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        verificationEmail,
        setVerificationEmail,
        isAuth,
        setIsAuth,
        isVerified,
        setIsVerified,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
