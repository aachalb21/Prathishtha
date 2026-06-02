'use client';

import ProtectedRoute from '@components/AuthRoutes/ProtectedRoute';
import Dashboard from '@components/Dashboard/Dashboard';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredAuth="verified">
      <Dashboard />
    </ProtectedRoute>
  );
}
