'use client';

import { useState,useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProfileSection from './ProfileSection';
import QRCodeSection from './QRCodeSection';
import EventRegisteredSection from './EventRegisteredSection';
import LogoutButton from './LogoutButton';

export default function Dashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Demo loading, error, and userProfile state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Simulate fetching user profile

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    // Simulate async fetch
    setTimeout(() => {
      // Simulate success:
      setUserProfile({ name: 'John Doe', email: 'john@example.com' });
      setIsLoading(false);
      // To simulate error, uncomment below:
      // setError('Failed to load user profile'); setIsLoading(false);
    }, 1000);
  }, []);

  return (
   <div className="min-h-screen p-4 sm:px-6 pt-24">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black comic-style-text text-gray-900 mb-2">
              🎉 WELCOME TO YOUR DASHBOARD
            </h1>
            <p className="text-sm text-white font-semibold">
              Manage your profile, view your QR code, and check registered events
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[
            { id: 'profile', label: '👤 Profile', icon: '👤' },
            { id: 'qrcode', label: '📱 QR Code', icon: '📱' },
            { id: 'events', label: '🎪 Events', icon: '🎪' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-black rounded-xl border-4 border-black transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-linear-to-r from-purple-600 to-pink-500 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              } comic-button`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-xl font-comic">Loading...</div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 font-comic">Error: {error}</div>
          </div>
        ) : (
          <>
            {activeTab === 'profile' && <ProfileSection userProfile={userProfile} />}
            {activeTab === 'qrcode' && <QRCodeSection />}
            {activeTab === 'events' && <EventRegisteredSection userProfile={userProfile} />}
          </>
        )}
      </div>
    </div>
  );
}
