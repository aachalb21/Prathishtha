'use client';

import { useState } from 'react';
import { useUserProfile } from '@/app/Service/Stores';
import logger from '@/utils/logger';
import Image from 'next/image';

export default function QRCodeSection() {
  const userProfile = useUserProfile();
  const [isDownloading, setIsDownloading] = useState(false);

  // Get QR code from user profile
  const qrCodeData = userProfile?.qrCode;
  const qrCodeUrl = qrCodeData?.url;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      if (!qrCodeUrl) {
        logger.error('QR code URL not available');
        return;
      }
      
      // Fetch the image and download
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QR_Code_${userProfile?.student_prn || userProfile?._id}.png`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Error downloading QR code:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Get user ID for display
  const userId = userProfile?.student_prn || userProfile?._id || 'N/A';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* QR Code Display */}
      <div className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-cyan-100 via-blue-50 to-purple-50 p-1">
        <div className="bg-white rounded-2xl p-8">
          <h2 className="text-2xl font-black comic-style-text text-gray-900 mb-6 text-center">
            📱 YOUR QR CODE
          </h2>

          {qrCodeUrl ? (
            <>
              {/* QR Code Image */}
              <div className="aspect-square bg-white border-4 border-black rounded-xl overflow-hidden flex items-center justify-center mb-6">
                <Image
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-full h-full object-contain p-2"
                  width={300}
                  height={300}
                />
              </div>

              {/* QR Info */}
              <div className="p-4 border-2 border-black rounded-lg bg-gray-50 mb-6">
                
                {qrCodeData?.data && (
                  <>
                    <p className="text-xs font-black text-gray-700 mb-1 mt-3">🎫 PRN</p>
                    <p className="text-sm font-black text-gray-900">{qrCodeData.data.prn}</p>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="aspect-square bg-yellow-50 rounded-xl border-4 border-dashed border-yellow-400 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="font-black text-yellow-700">No QR Code Available</p>
              </div>
            </div>
          )}

          {/* Info Text */}
          <p className="text-xs text-gray-600 text-center font-semibold mb-4">
            ℹ️ Show this QR code during event check-in
          </p>
        </div>
      </div>

      {/* QR Code Actions */}
      <div className="space-y-4">
        {/* Download Card */}
        <div className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-green-100 via-emerald-50 to-teal-50 p-1">
          <div className="bg-white rounded-2xl p-6">
            <h3 className="text-xl font-black comic-style-text text-gray-900 mb-4">
              💾 DOWNLOAD QR CODE
            </h3>
            <p className="text-sm text-gray-600 font-semibold mb-4">
              Download your QR code as an image file for offline use.
            </p>
            <button
              onClick={handleDownload}
              disabled={isDownloading || !qrCodeUrl}
              className={`w-full py-3 px-4 text-white font-black text-lg rounded-xl border-4 border-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all transform uppercase comic-button ${
                isDownloading || !qrCodeUrl
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-500'
              }`}
            >
              {isDownloading ? '⏳ DOWNLOADING...' : '📥 DOWNLOAD QR CODE'}
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="comic-border rounded-2xl shadow-xl overflow-hidden bg-linear-to-br from-blue-100 via-indigo-50 to-purple-50 p-1">
          <div className="bg-white rounded-2xl p-6">
            <h3 className="text-xl font-black comic-style-text text-gray-900 mb-4">
              ℹ️ HOW TO USE
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="font-black text-lg">1️⃣</span>
                <p className="text-sm font-semibold text-gray-700">Download your QR code</p>
              </div>
              <div className="flex gap-3">
                <span className="font-black text-lg">2️⃣</span>
                <p className="text-sm font-semibold text-gray-700">Bring it to the event venue</p>
              </div>
              <div className="flex gap-3">
                <span className="font-black text-lg">3️⃣</span>
                <p className="text-sm font-semibold text-gray-700">Show it during check-in</p>
              </div>
              <div className="flex gap-3">
                <span className="font-black text-lg">4️⃣</span>
                <p className="text-sm font-semibold text-gray-700">Get your event stamp/certificate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
