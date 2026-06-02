# Protected Routes Guide

This guide explains how to implement route protection in your application.

## Overview

The application has three protection levels:

1. **Public Routes** - Anyone can access (login, signup pages)
2. **Protected Routes - Authenticated** - Must be logged in (isAuth = true)
3. **Protected Routes - Verified** - Must be logged in AND verified (isAuth = true && isVerified = true)

## How to Use

### 1. For Pages Accessible to Everyone (Public Routes)

Use `PublicRoute` wrapper - redirects authenticated & verified users away from login/signup:

```jsx
'use client';

import PublicRoute from '../components/PublicRoute';
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  return (
    <PublicRoute>
      <LoginForm />
    </PublicRoute>
  );
}
```

**Current Pages Using PublicRoute:**
- `/login`
- `/sign-up`

---

### 2. For Pages Requiring Authentication Only

Use `ProtectedRoute` with `requiredAuth="auth"` - user must be logged in but doesn't need to be verified:

```jsx
'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import VerifyForm from '../components/VerifyForm';

export default function VerifyPage() {
  return (
    <ProtectedRoute requiredAuth="auth">
      <VerifyForm />
    </ProtectedRoute>
  );
}
```

**Current Pages Using ProtectedRoute (auth):**
- `/verify`

---

### 3. For Pages Requiring Authentication AND Verification

Use `ProtectedRoute` with `requiredAuth="verified"` - user must be both logged in and verified:

```jsx
'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../components/Dashboard';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredAuth="verified">
      <Dashboard />
    </ProtectedRoute>
  );
}
```

**Example Pages That Should Use verified:**
- `/dashboard`
- `/gallery`
- `/profile`
- `/events`

---

## Authentication Flow

```
1. User visits /login
   ↓
2. Enters credentials → clicks login
   → setIsAuth(true)
   → Redirected to /verify
   ↓
3. Enters OTP code
   → Verification successful
   → setIsVerified(true)
   → Redirected to /dashboard
   ↓
4. User can now access all protected pages
```

---

## Context Usage

The `useAuth()` hook provides:

```javascript
const {
  verificationEmail,      // Email used for verification
  setVerificationEmail,   // Set email (done in login form)
  isAuth,                 // Is user authenticated (logged in)
  setIsAuth,              // Set authentication (done in login form)
  isVerified,             // Is user verified
  setIsVerified,          // Set verification (done in verify form)
  isLoading,              // Is auth state loading
  logout,                 // Logout function
} = useAuth();
```

### Example: Logout Function

```jsx
import { useAuth } from '../context/AuthContext';

export default function UserMenu() {
  const { logout } = useAuth();

  return (
    <button onClick={logout}>
      Logout
    </button>
  );
}
```

---

## State Persistence

All auth states are automatically saved to localStorage:
- `isAuth`
- `isVerified`
- `verificationEmail`

This means:
- User stays logged in after page refresh
- User stays verified after page refresh
- Data persists until logout is called

---

## Redirect Behavior

### ProtectedRoute Redirects:
- ✅ Authenticated + Verified → Allow access
- ❌ Authenticated + Not Verified → Redirect to `/verify`
- ❌ Not Authenticated → Redirect to `/login`

### PublicRoute Redirects:
- ✅ Not Authenticated → Allow access
- ✅ Authenticated + Not Verified → Allow access
- ❌ Authenticated + Verified → Redirect to `/`

---

## Adding Protection to Existing Pages

To protect an existing page, wrap it with the appropriate component:

**Before:**
```jsx
export default function GalleryPage() {
  return <Gallery />;
}
```

**After (for verified access only):**
```jsx
import ProtectedRoute from '../components/ProtectedRoute';

export default function GalleryPage() {
  return (
    <ProtectedRoute requiredAuth="verified">
      <Gallery />
    </ProtectedRoute>
  );
}
```

---

## Important Notes

1. **Always use `'use client';`** at the top of pages that use route protection
2. **Load state** - While auth is being checked, a loading screen is shown
3. **Redirect happens automatically** - No need to manually check auth status
4. **Logout clears all data** - Email and verification status are cleared
5. **localStorage** - Users must have localStorage enabled for persistence

---

## Testing the Protected Routes

1. **Test Login:**
   - Go to `/login` → Should be accessible
   - Fill email + password → Click login
   - Should be redirected to `/verify`

2. **Test Verification:**
   - At `/verify` → Email should be pre-filled (read-only)
   - Enter OTP code → Click verify
   - Should set `isVerified = true`

3. **Test Full Auth:**
   - Try accessing `/verify` without logging in
   - Should redirect to `/login`
   - Try accessing dashboard without verification
   - Should redirect to `/verify`

4. **Test Logout:**
   - Click logout button
   - Try accessing protected page
   - Should redirect to `/login`
