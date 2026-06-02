# User API Integration Guide

This document explains how to integrate and use the user API services in your components.

## Overview

The user API integration is built using:
- **Zustand** for state management
- **Axios** for HTTP requests
- **Custom hooks** for easy component integration
- **Specialized API services** for different features

## Architecture

```
Component
    ↓
useUserHooks (Custom Hooks)
    ↓
useUserStore (Zustand Store)
    ↓
UserAPI / QRCodeAPI / ContactFormAPI / PasswordResetAPI
    ↓
apiClient (Axios)
    ↓
Backend API
```

## Quick Start

### 1. Fetch User Profile

```jsx
'use client';
import { useUserProfile, useProfileActions, useUserLoading, useUserError } from '@/app/Service/Stores';

export default function ProfilePage() {
  const userProfile = useUserProfile();
  const { fetchUserProfile } = useProfileActions();
  const isLoading = useUserLoading();
  const error = useUserError();

  useEffect(() => {
    if (!userProfile) {
      fetchUserProfile();
    }
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{userProfile?.name}</h1>
      <p>{userProfile?.email}</p>
    </div>
  );
}
```

### 2. Update User Profile

```jsx
import { useProfileActions, useUserLoading, useUserError } from '@/app/Service/Stores';

export default function EditProfileForm() {
  const { updateUserProfile } = useProfileActions();
  const isLoading = useUserLoading();
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateUserProfile(formData);
    if (result.success) {
      console.log('Profile updated!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### 3. QR Code Operations

```jsx
import { 
  useUserQRCode, 
  useQRCodeActions, 
  useUserLoading 
} from '@/app/Service/Stores';

export default function QRCodePage() {
  const { qrCode, qrCodeUrl } = useUserQRCode();
  const { fetchUserQRCode, downloadQRCode, regenerateQRCode } = useQRCodeActions();
  const isLoading = useUserLoading();
  const userId = 'user-123'; // Get from auth store

  useEffect(() => {
    fetchUserQRCode(userId);
  }, []);

  const handleDownload = async () => {
    const result = await downloadQRCode(userId);
    if (result.success) {
      // Create download link
      const link = document.createElement('a');
      link.href = result.blobUrl;
      link.download = 'qr-code.png';
      link.click();
    }
  };

  const handleRegenerate = async () => {
    await regenerateQRCode(userId);
  };

  return (
    <div>
      {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" />}
      <button onClick={handleDownload} disabled={isLoading}>Download</button>
      <button onClick={handleRegenerate} disabled={isLoading}>Regenerate</button>
    </div>
  );
}
```

### 4. Contact Form

```jsx
import { useContactActions, useUserLoading } from '@/app/Service/Stores';
import { useState } from 'react';

export default function ContactForm() {
  const { submitContactForm } = useContactActions();
  const isLoading = useUserLoading();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await submitContactForm(formData);
    if (result.success) {
      alert('Message sent successfully!');
      setFormData({ name: '', email: '', message: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Your name"
        required
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Your email"
        required
      />
      <textarea
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        placeholder="Your message"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
```

### 5. Password Reset

```jsx
import { usePasswordActions, useUserLoading } from '@/app/Service/Stores';

export default function ForgotPasswordPage() {
  const { requestPasswordReset, resetPassword, verifyResetToken } = usePasswordActions();
  const isLoading = useUserLoading();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('request'); // request, verify, reset

  const handleRequestReset = async (e) => {
    e.preventDefault();
    const result = await requestPasswordReset(email);
    if (result.success) {
      setStep('reset');
    }
  };

  return (
    <div>
      {step === 'request' && (
        <form onSubmit={handleRequestReset}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <button type="submit" disabled={isLoading}>Request Reset Link</button>
        </form>
      )}
    </div>
  );
}
```

## Available Hooks

### Profile Hooks
- `useUserProfile()` - Get user profile data
- `useProfileActions()` - Profile fetch/update actions
- `isProfileStale()` - Check if profile needs refresh

### QR Code Hooks
- `useUserQRCode()` - Get QR code data and URL
- `useQRCodeActions()` - QR code operations

### Contact Hooks
- `useContactActions()` - Contact form operations

### Password Hooks
- `usePasswordActions()` - Password reset operations

### General Hooks
- `useUserLoading()` - Loading state
- `useUserError()` - Error messages
- `useUserState()` - Full user state
- `useUserActions()` - All available actions

## API Services (Direct Usage)

If you need to use the API services directly (without store):

```jsx
import { UserAPI, QRCodeAPI, ContactFormAPI, PasswordResetAPI } from '@/app/Service/Api';

// Direct API calls
const userProfile = await UserAPI.getCurrentUser();
const qrCode = await QRCodeAPI.getUserQRCode(userId);
const contactResult = await ContactFormAPI.submitContactForm({
  name: 'John',
  email: 'john@example.com',
  message: 'Hello'
});
```

## Response Format

All API services return a consistent response format:

```javascript
{
  success: boolean,
  data: any,          // API response data
  message: string,    // Success or error message
  error: string,      // Error details (if failed)
  status: number,     // HTTP status code (if error)
  errors: object      // Validation errors (if any)
}
```

## Error Handling

```jsx
const { submitContactForm } = useContactActions();
const error = useUserError();

const handleSubmit = async (data) => {
  const result = await submitContactForm(data);
  
  if (!result.success) {
    console.error('API Error:', result.error);
    console.error('Message:', result.message);
    if (result.errors) {
      console.error('Validation Errors:', result.errors);
    }
  }
};
```

## Store Integration Pattern

Each store integrates with specific API services:

### useUserStore
- Uses: `UserAPI` - Core user profile operations
- Manages: User profile, profile updates, leaderboard

### useUserStore (QR Operations)
- Uses: `QRCodeAPI` - QR code specific operations  
- Manages: QR codes, QR verification

### useUserStore (Contact)
- Uses: `ContactFormAPI` - Contact form operations
- Manages: Contact submissions, contact info

### useUserStore (Password)
- Uses: `PasswordResetAPI` - Password operations
- Manages: Password reset, token verification

## Persistence

The user store automatically persists these to localStorage:
- `userProfile`
- `qrCode`
- `leaderboardPosition`

Auth store persists:
- `user`
- `isAuthenticated`

## Token Management

Tokens are automatically managed by `TokenManager` and don't need manual handling in components. The store handles:
- Token storage in secure storage
- Token refresh automatically
- Authorization header injection
- Token cleanup on logout

## Best Practices

1. **Use hooks over store directly** - Hooks are optimized for component subscriptions
2. **Handle loading states** - Always check `useUserLoading()` before rendering
3. **Handle errors gracefully** - Always check `result.success` after API calls
4. **Cache profile data** - Check `isProfileStale()` before re-fetching
5. **Cleanup on unmount** - The store handles this automatically
6. **Combine with auth** - Always ensure user is authenticated before fetching profile

## Example: Complete Integration

```jsx
'use client';
import { useEffect, useState } from 'react';
import {
  useUserProfile,
  useProfileActions,
  useUserLoading,
  useUserError,
  useIsAuthenticated,
} from '@/app/Service/Stores';

export default function UserDashboard() {
  const isAuthenticated = useIsAuthenticated();
  const userProfile = useUserProfile();
  const { fetchUserProfile, isProfileStale } = useProfileActions();
  const isLoading = useUserLoading();
  const error = useUserError();

  useEffect(() => {
    if (isAuthenticated && (!userProfile || isProfileStale())) {
      fetchUserProfile();
    }
  }, [isAuthenticated, userProfile, fetchUserProfile, isProfileStale]);

  if (!isAuthenticated) {
    return <div>Please login first</div>;
  }

  if (isLoading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Welcome, {userProfile?.name}!</h1>
      <p>Email: {userProfile?.email}</p>
      {/* More profile details */}
    </div>
  );
}
```

## Troubleshooting

### Profile not updating
- Check if user is authenticated
- Verify API endpoint is correct
- Check network tab for API errors
- Ensure tokens are valid

### QR code not loading
- Verify user ID is correct
- Check if QR code exists in backend
- Verify permissions

### Contact form not submitting
- Check email validation
- Verify required fields are filled
- Check CORS settings on backend

## Future Enhancements

To add more user API integrations:

1. Create new API service: `app/Service/Api/NewFeatureAPI.js`
2. Add methods to `useUserStore` in `app/Service/Stores/userStore.js`
3. Create hooks in `app/Service/Stores/useUserHooks.js`
4. Export from `app/Service/Stores/index.js`
5. Use in components like any other hook

---

**Last Updated:** December 2024
