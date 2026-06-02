# Zustand Authentication Store - Setup & Usage Guide

## Overview

Production-ready authentication state management using Zustand with:
- ✅ DevTools integration for debugging
- ✅ Persistent storage (localStorage)
- ✅ Token management
- ✅ All authentication actions
- ✅ Custom hooks for clean component usage
- ✅ Scalable architecture for large applications

## Quick Start

### 1. Initialize in App Layout

**app/layout.js**
```javascript
'use client';

import { useEffect } from 'react';
import { initializeStores } from '@/app/Service/Stores/StoreInitializer';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize stores on app load
    initializeStores();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 2. Use in Components

```javascript
'use client';

import { useAuthActions, useUser } from '@/app/Service/Stores/useAuthHooks';

export default function MyComponent() {
  const { login } = useAuthActions();
  const user = useUser();

  const handleLogin = async () => {
    const result = await login('user@example.com', 'password');
    if (result.success) {
      console.log('Logged in!');
    }
  };

  return (
    <div>
      <p>User: {user?.name}</p>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
```

## File Structure

```
app/Service/Stores/
├── authStore.js              # Main auth store
├── StoreInitializer.js       # Store initialization service
├── useAuthHooks.js           # Custom hooks
└── index.js                  # Central exports
```

## Auth Store - Main State

```typescript
interface AuthState {
  // State
  user: Object | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  tokenExpiry: number | null

  // Auth Actions
  login(email, password): Promise
  signup(email, password, name, phone): Promise
  logout(): Promise
  
  // Token Actions
  refreshAccessToken(): Promise
  isTokenExpired(): boolean
  getTokenRemainingTime(): number
  
  // Password Actions
  requestPasswordReset(email): Promise
  resetPassword(token, password): Promise
  changePassword(currentPassword, newPassword): Promise
  
  // Email Actions
  verifyEmail(token): Promise
  resendVerificationEmail(email): Promise
  
  // Utilities
  setUser(user): void
  clearError(): void
  initializeAuth(): Promise
}
```

## Custom Hooks

### Basic Hooks

```javascript
import { useAuthStore } from '@/app/Service/Stores';

// Get current user
const user = useUser();

// Check authentication
const isAuthenticated = useIsAuthenticated();

// Get loading state
const isLoading = useAuthLoading();

// Get error message
const error = useAuthError();

// Get all auth state
const { user, isAuthenticated, isLoading, error } = useAuthState();
```

### Action Hooks

```javascript
// Login/Signup/Logout
const { login, signup, logout, setUser, clearError, refreshAccessToken } = 
  useAuthActions();

// Password management
const { requestPasswordReset, resetPassword, changePassword } = 
  usePasswordActions();

// Email verification
const { verifyEmail, resendVerificationEmail } = useEmailActions();

// Token information
const { accessToken, refreshToken, isTokenExpired, remainingTime } = 
  useTokenInfo();
```

## Usage Examples

### Example 1: Login

```javascript
'use client';

import { useAuthActions, useAuthError } from '@/app/Service/Stores/useAuthHooks';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthActions();
  const error = useAuthError();

  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    
    if (result.success) {
      router.push('/dashboard');
    } else {
      console.error('Login failed:', result.error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const email = e.target.email.value;
      const password = e.target.password.value;
      handleLogin(email, password);
    }}>
      {error && <p className="text-red-500">{error}</p>}
      <input type="email" name="email" placeholder="Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Example 2: Protected Route

```javascript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useAuthLoading } from '@/app/Service/Stores/useAuthHooks';

export default function Dashboard() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <div>Dashboard Content</div>;
}
```

### Example 3: Change Password

```javascript
'use client';

import { usePasswordActions } from '@/app/Service/Stores/useAuthHooks';

export default function ChangePasswordPage() {
  const { changePassword } = usePasswordActions();

  const handleChangePassword = async (currentPassword, newPassword) => {
    const result = await changePassword(currentPassword, newPassword);
    
    if (result.success) {
      alert('Password changed successfully!');
    } else {
      alert('Error: ' + result.error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const current = e.target.current.value;
      const newPass = e.target.new.value;
      handleChangePassword(current, newPass);
    }}>
      <input type="password" name="current" placeholder="Current Password" required />
      <input type="password" name="new" placeholder="New Password" required />
      <button type="submit">Change Password</button>
    </form>
  );
}
```

### Example 4: Check Token Status

```javascript
'use client';

import { useEffect } from 'react';
import { useTokenInfo } from '@/app/Service/Stores/useAuthHooks';
import { useAuthStore } from '@/app/Service/Stores';

export default function TokenStatusComponent() {
  const { isTokenExpired, remainingTime } = useTokenInfo();
  const refreshAccessToken = useAuthStore((state) => state.refreshAccessToken);

  useEffect(() => {
    if (isTokenExpired) {
      refreshAccessToken();
    }

    // Refresh token 1 minute before expiry
    if (remainingTime > 0 && remainingTime < 60) {
      refreshAccessToken();
    }
  }, [isTokenExpired, remainingTime, refreshAccessToken]);

  return (
    <div>
      <p>Token expires in: {remainingTime} seconds</p>
      {isTokenExpired && <p className="text-red-500">Token expired!</p>}
    </div>
  );
}
```

### Example 5: Email Verification

```javascript
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEmailActions } from '@/app/Service/Stores/useAuthHooks';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail } = useEmailActions();

  useEffect(() => {
    if (token) {
      verifyEmail(token).then((result) => {
        if (result.success) {
          alert('Email verified successfully!');
        } else {
          alert('Verification failed: ' + result.error);
        }
      });
    }
  }, [token, verifyEmail]);

  return <div>Verifying email...</div>;
}
```

## DevTools Integration

The store is integrated with Zustand DevTools for easy debugging:

1. Install Redux DevTools extension in Chrome
2. Open DevTools and go to Redux tab
3. See all state changes and actions in real-time

## Persistence

Auth state is automatically persisted to localStorage:
- `user` - Stored user data
- `isAuthenticated` - Authentication status

Other state (tokens, loading, error) is not persisted for security.

## Best Practices

### ✅ Do's
- Use custom hooks for clean code
- Initialize stores in layout
- Check `isLoading` before rendering
- Handle errors gracefully
- Use Zustand DevTools for debugging
- Protect routes with `useIsAuthenticated`

### ❌ Don'ts
- Don't store sensitive data in localStorage directly
- Don't call store actions without error handling
- Don't forget to initialize on app start
- Don't render protected content before auth check
- Don't expose tokens in URLs

## Scaling to Large Applications

The store is designed to be extended. To add more stores:

1. Create new store file in `Stores/`
```javascript
export const useUserStore = create(
  devtools(
    persist(
      (set, get) => ({
        // Store logic
      }),
      { name: 'user-store' }
    ),
    { name: 'User Store' }
  )
);
```

2. Export from `Stores/index.js`
```javascript
export { useAuthStore } from './authStore';
export { useUserStore } from './userStore';
```

3. Use in components
```javascript
import { useAuthStore, useUserStore } from '@/app/Service/Stores';
```

## Token Refresh Flow

The store automatically manages tokens:

1. Access token stored with expiry time
2. `useTokenInfo()` hook provides expiry info
3. Components can check `isTokenExpired()` 
4. Call `refreshAccessToken()` when needed
5. InterceptorService also auto-refreshes on 401

## Troubleshooting

| Issue | Solution |
|-------|----------|
| State not persisting | Check localStorage is enabled |
| Components not updating | Ensure using hooks, not direct state access |
| Token not refreshing | Verify refresh token is valid |
| DevTools not showing | Reinstall Redux DevTools extension |
| Store not initializing | Call `initializeStores()` in layout |

## File Locations

```
app/
├── layout.js                          # Initialize stores here
├── Service/
│   ├── Api/
│   │   ├── api.js                    # Axios instance
│   │   ├── AuthAPI.js                # Auth API calls
│   │   ├── TokenManager.js           # Token storage
│   │   ├── TokenRefreshService.js    # Token refresh
│   │   └── InterceptorService.js     # Request interceptors
│   └── Stores/
│       ├── authStore.js              # Main auth store
│       ├── StoreInitializer.js       # Store init service
│       ├── useAuthHooks.js           # Custom hooks
│       └── index.js                  # Exports
└── components/
    └── examples/
        ├── LayoutSetup.jsx
        ├── LoginWithStore.jsx
        ├── SignupWithStore.jsx
        └── ProtectedComponent.jsx
```

## Summary

This Zustand setup provides:
- ✅ Centralized authentication state
- ✅ DevTools debugging
- ✅ Persistent storage
- ✅ Complete auth workflow
- ✅ Custom hooks for clean components
- ✅ Production-ready architecture
- ✅ Scalable for large apps

Ready to use! 🚀
