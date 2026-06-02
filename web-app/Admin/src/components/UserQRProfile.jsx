import React, { useState, useEffect } from 'react'
import { QrCodeIcon, DownloadIcon, RefreshIcon } from '@heroicons/react/24/outline'
import { qrCodeAPI } from '../services/api'
import logger from '../utils/logger'

const UserQRProfile = ({ userId, showControls = true, size = 'medium' }) => {
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [regenerating, setRegenerating] = useState(false)

  const sizeClasses = {
    small: 'w-32 h-32',
    medium: 'w-48 h-48',
    large: 'w-64 h-64'
  }

  useEffect(() => {
    if (userId) {
      fetchUserQR()
    }
  }, [userId])

  const fetchUserQR = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await qrCodeAPI.getUserQRCode(userId)
      if (response.success) {
        setQrData(response.data)
      } else {
        setError(response.message || 'Failed to fetch QR code')
      }
    } catch (err) {
      logger.error('Error fetching QR code:', err);
      setError('Failed to load QR code');
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/users/qr-code/${userId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `qr_code_${qrData?.user?.prn || userId}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Download failed')
      }
    } catch (err) {
      logger.error('Download error:', err);
      alert('Failed to download QR code');
    }
  }

  const handleRegenerate = async () => {
    try {
      setRegenerating(true)
      const response = await qrCodeAPI.regenerateQRCode(userId)
      if (response.success) {
        setQrData(response.data)
        alert('QR code regenerated successfully')
      } else {
        throw new Error(response.message || 'Regeneration failed')
      }
    } catch (err) {
      logger.error('Regenerate error:', err);
      alert('Failed to regenerate QR code');
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${sizeClasses[size]} bg-red-50 border-2 border-red-200 rounded-lg flex flex-col items-center justify-center text-red-600 p-4`}>
        <QrCodeIcon className="h-8 w-8 mb-2" />
        <p className="text-sm text-center">{error}</p>
        {showControls && (
          <button 
            onClick={fetchUserQR}
            className="mt-2 text-xs px-2 py-1 bg-red-100 rounded hover:bg-red-200"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  if (!qrData?.qrCode?.url) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-50 border-2 border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-500 p-4`}>
        <QrCodeIcon className="h-8 w-8 mb-2" />
        <p className="text-sm text-center">No QR code available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* User Info Header */}
      <div className="text-center mb-4">
        <h3 className="font-semibold text-gray-900">{qrData.user?.name}</h3>
        <p className="text-sm text-gray-600">PRN: {qrData.user?.prn}</p>
        <p className="text-xs text-gray-500">
          Generated: {new Date(qrData.qrCode?.generatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* QR Code Image */}
      <div className="flex justify-center mb-4">
        <div className={`${sizeClasses[size]} bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center`}>
          <img 
            src={qrData.qrCode.url} 
            alt={`QR Code for ${qrData.user?.name}`}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div className="hidden flex-col items-center justify-center text-gray-400">
            <QrCodeIcon className="h-8 w-8 mb-1" />
            <span className="text-xs">Failed to load</span>
          </div>
        </div>
      </div>

      {/* QR Data Info */}
      <div className="text-xs text-gray-500 mb-4 space-y-1">
        <p><strong>User ID:</strong> {qrData.qrCode?.data?.userId}</p>
        <p><strong>Type:</strong> {qrData.qrCode?.data?.type}</p>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
            title="Download QR Code"
          >
            <DownloadIcon className="h-4 w-4" />
            Download
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm disabled:opacity-50"
            title="Regenerate QR Code"
          >
            <RefreshIcon className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
      )}
    </div>
  )
}

export default UserQRProfile