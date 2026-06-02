'use client';

import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="px-6 py-3 bg-red-600 text-white font-black rounded-xl border-4 border-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all transform uppercase comic-button"
    >
      🚪 LOGOUT
    </button>
  );
}
