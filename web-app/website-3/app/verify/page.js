'use client';

import VerifyForm from '@components/VerifyForm';
import ProtectedRoute from '@components/AuthRoutes/ProtectedRoute';

export default function VerifyPage() {
  return (
    <ProtectedRoute requiredAuth="auth">
      <div>
        <VerifyForm />
      </div>
    </ProtectedRoute>
  );
}
