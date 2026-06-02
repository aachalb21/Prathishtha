# Token Management Implementation Guide

## Quick Start

### 1. Initialize Interceptors in Your App Layout

**app/layout.js** or **app/layout.tsx**
```javascript
'use client';

import { initializeInterceptors } from '@/app/Service/Api/InterceptorService';

// Initialize interceptors once when app loads
initializeInterceptors();

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 2. Store Tokens After Login

After your login API call, store the tokens:

```javascript
import TokenManager from '@/app/Service/Api/TokenManager';

// After successful login from your backend
const { accessToken, refreshToken, expiresIn } = loginResponse.data;

TokenManager.setTokens(accessToken, refreshToken, expiresIn);
```

### 3. Use in Your API Calls

The tokens are automatically attached to all requests:

```javascript
import apiClient from '@/app/Service/Api/api';

// Token is automatically included in header
const response = await apiClient.get('/user/profile');
```

## Services Overview

### TokenManager
Stores and retrieves tokens from localStorage

```javascript
import TokenManager from '@/app/Service/Api/TokenManager';

// Store tokens after login
TokenManager.setTokens(accessToken, refreshToken, expiresIn);

// Get access token
const token = TokenManager.getAccessToken();

// Get refresh token
const refreshToken = TokenManager.getRefreshToken();

// Check if token expired
const isExpired = TokenManager.isAccessTokenExpired();

// Update only access token
TokenManager.updateAccessToken(newAccessToken, expiresIn);

// Clear all tokens on logout
TokenManager.clearTokens();

// Check if user has valid tokens
const hasTokens = TokenManager.hasValidTokens();
```

### TokenRefreshService
Handles token refresh automatically

```javascript
import TokenRefreshService from '@/app/Service/Api/TokenRefreshService';

// Refresh access token using stored refresh token
const response = await TokenRefreshService.refreshAccessToken();

if (response.success) {
  const { accessToken, expiresIn } = response.data;
}

// Get valid access token (refreshes if expired)
const validToken = await TokenRefreshService.getValidAccessToken();
```

### InterceptorService
Automatically handles token attachment and refresh

```javascript
import { initializeInterceptors } from '@/app/Service/Api/InterceptorService';

// Call once in your app initialization
initializeInterceptors();

// Features:
// 1. Automatically attaches access token to all requests
// 2. Detects 401 responses (token expired)
// 3. Automatically refreshes token using refresh token
// 4. Retries failed request with new token
// 5. Queues requests during refresh to prevent race conditions
// 6. Redirects to /login on refresh failure
```

## How Token Refresh Works

```
1. User logs in
   ↓
2. Backend returns: accessToken, refreshToken, expiresIn
   ↓
3. Store tokens: TokenManager.setTokens(...)
   ↓
4. Make API request → Interceptor attaches accessToken
   ↓
5. If API returns 401:
   a. Interceptor detects 401
   b. TokenRefreshService calls /auth/refresh-token with refreshToken
   c. Backend returns new accessToken
   d. TokenManager updates with new token
   e. Interceptor retries original request with new token
   f. Request succeeds
   ↓
6. If refresh fails:
   a. Clear all tokens
   b. Redirect to /login page
```

## Backend API Endpoints Required

### POST /auth/refresh-token
**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "expiresIn": 3600
}
```

## Usage Examples

### Example 1: Login and Store Tokens

```javascript
'use client';

import { useState } from 'react';
import apiClient from '@/app/Service/Api/api';
import TokenManager from '@/app/Service/Api/TokenManager';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const { accessToken, refreshToken, expiresIn } = response.data;

      // Store tokens
      TokenManager.setTokens(accessToken, refreshToken, expiresIn);

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Example 2: Make Protected API Calls

```javascript
'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/app/Service/Api/api';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Token is automatically attached by interceptor
        const response = await apiClient.get('/user/profile');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div>
      {user && <h1>Welcome, {user.name}!</h1>}
    </div>
  );
}
```

### Example 3: Logout

```javascript
import TokenManager from '@/app/Service/Api/TokenManager';

const handleLogout = async () => {
  // Optional: Notify backend
  try {
    await apiClient.post('/auth/logout', {
      refreshToken: TokenManager.getRefreshToken(),
    });
  } catch (error) {
    console.warn('Logout notification failed');
  }

  // Clear tokens
  TokenManager.clearTokens();

  // Redirect to login
  window.location.href = '/login';
};
```

## Storage Structure

Tokens are stored in localStorage with these keys:

```javascript
localStorage: {
  'auth_access_token': 'eyJhbGc...',           // JWT token
  'auth_refresh_token': 'eyJhbGc...',          // Refresh token
  'auth_token_expiry': '1702094400000'         // Expiry timestamp (ms)
}
```

## Security Considerations

1. ✅ Tokens stored in localStorage (suitable for SPAs)
2. ✅ HTTPS enforced in production (via environment config)
3. ✅ Short-lived access tokens (configurable)
4. ✅ Long-lived refresh tokens (backend managed)
5. ✅ Automatic token refresh on 401
6. ✅ Secure logout clearing all tokens
7. ✅ No tokens in URL or visible in network requests

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tokens not persisting | Check if localStorage is available |
| 401 loop after refresh | Verify refresh token is valid on backend |
| Tokens not in requests | Ensure `initializeInterceptors()` is called |
| Logout doesn't work | Manually clear browser storage or hard refresh |
| CORS errors | Configure CORS on backend API |

## File Structure

```
app/
└── Service/
    └── Api/
        ├── api.js                      # Axios instance
        ├── TokenManager.js             # Token storage
        ├── TokenRefreshService.js      # Token refresh logic
        └── InterceptorService.js       # Request/response interceptors
```

Done! Your token management is now set up. The system will:
- ✅ Automatically attach tokens to all requests
- ✅ Refresh tokens when they expire
- ✅ Handle 401 errors transparently
- ✅ Queue requests during refresh
- ✅ Redirect to login on failure
