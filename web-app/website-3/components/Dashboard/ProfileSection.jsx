'use client';

import { useUser, useUserProfile, useProfileActions, useUserLoading, useUserError } from "@/app/Service/Stores";
import { useEffect } from "react";
export default function ProfileSection() {

  const user = useUser();
  const userProfile = useUserProfile();
  const { fetchUserProfile } = useProfileActions();
  const isLoading = useUserLoading();
  const error = useUserError();

  // Fetch user profile when user changes or on component mount
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user?.id, user?.email]); // Re-fetch when user identity changes

  // Show loading state if user data is not available
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-blue-100 via-purple-50 to-pink-50 p-1">
            <div className="bg-white rounded-2xl p-6 text-center">
              <p className="text-gray-500">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-red-100 via-orange-50 to-pink-50 p-1">
            <div className="bg-white rounded-2xl p-6 text-center">
              <p className="text-red-500">❌ {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-blue-100 via-purple-50 to-pink-50 p-1">
            <div className="bg-white rounded-2xl p-6 text-center">
              <p className="text-gray-500">No profile data available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profileData = {
    name: userProfile?.name || 'User',
    email: userProfile?.email || 'N/A',
    studentId: userProfile?.student_prn || 'N/A',
    collegeName: userProfile?.College_name || 'N/A',
    department: userProfile?.Department || 'N/A',
    year: userProfile?.Year || 'N/A',
    gender: userProfile?.Gender || 'N/A',
    type: userProfile?.type || 'User',
    eventsAttended: userProfile?.eventsAttendedCount || 0,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Card - Left Side */}
      <div className="lg:col-span-1">
        <div className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-blue-100 via-purple-50 to-pink-50 p-1">
          <div className="bg-white rounded-2xl p-6">
            <div className="text-center">
              {/* Avatar with Initials */}
              <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-black bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-4xl font-black text-white">
                {profileData.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>

              {/* Name */}
              <h2 className="text-2xl font-black comic-style-text text-gray-900 mb-1">
                {profileData.name}
              </h2>

              {/* Status Badge */}
              <div className={`inline-block px-4 py-2 rounded-full mb-4 ${
                userProfile?.isVerified 
                  ? 'bg-green-100 border-2 border-green-600' 
                  : 'bg-yellow-100 border-2 border-yellow-600'
              }`}>
                <p className={`text-xs font-black ${
                  userProfile?.isVerified 
                    ? 'text-green-800' 
                    : 'text-yellow-800'
                }`}>
                  {userProfile?.isVerified ? '✅ VERIFIED' : '⏳ PENDING VERIFICATION'}
                </p>
              </div>

              {/* Quick Info */}
              <div className="space-y-2 text-left">
                <p className="text-sm font-bold text-gray-700">
                  📧 <span className="text-gray-600">{profileData.email}</span>
                </p>
                <p className="text-sm font-bold text-gray-700">
                  🎓 <span className="text-gray-600">{profileData.studentId}</span>
                </p>
                <p className="text-sm font-bold text-gray-700">
                  🏢 <span className="text-gray-600">{profileData.collegeName}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details - Right Side */}
      <div className="lg:col-span-2">
        <div className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-yellow-100 via-orange-50 to-red-50 p-1">
          <div className="bg-white rounded-2xl p-6">
            <h3 className="text-xl font-black comic-style-text text-gray-900 mb-6">
              📋 PROFILE DETAILS
            </h3>

            {/* View Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: 'Name', value: profileData.name, icon: '👤' },
                { label: 'Email', value: profileData.email, icon: '📧' },
                { label: 'Student ID', value: profileData.studentId, icon: '🎓' },
                { label: 'Department', value: profileData.department, icon: '📚' },
                { label: 'Year', value: profileData.year, icon: '📅' },
                { label: 'Gender', value: profileData.gender, icon: '👥' },
                { label: 'Type', value: profileData.type, icon: '🏷️' },
                { label: 'Events Attended', value: profileData.eventsAttended, icon: '✅' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 border-2 border-black rounded-lg bg-gray-50">
                  <p className="text-xs font-black text-gray-700 mb-1">{item.icon} {item.label}</p>
                  <p className="text-sm font-bold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
