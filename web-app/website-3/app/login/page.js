'use client';

import LoginForm from '@components/LoginForm';
import PublicRoute from '@components/AuthRoutes/PublicRoute';

export default function LoginPage() {
  return (
    <PublicRoute>
      <div className="bg-[url('/Assets/Background/comic-bg.png')] bg-cover bg-center min-h-screen flex items-center justify-center">
        <LoginForm />
      </div>
    </PublicRoute>
  );
}
