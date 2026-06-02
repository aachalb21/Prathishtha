import React, { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import logger from '../utils/logger'
import { 
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CameraIcon,
  StopIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { qrCodeAPI } from '../services/api'

const QRScanner = ({ onScanSuccess, onScanError, showHistory = true }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [scanHistory, setScanHistory] = useState([])
  const [error, setError] = useState(null)
  const [cameraDevices, setCameraDevices] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [verifying, setVerifying] = useState(false)
  const scannerRef = useRef(null)
  const qrCodeScannerRef = useRef(null)

  useEffect(() => {
    getCameraDevices()
    
    // Load scan history from localStorage
    if (showHistory) {
      const savedHistory = localStorage.getItem('qrScanHistory')
      if (savedHistory) {
        setScanHistory(JSON.parse(savedHistory))
      }
    }
    
    return () => {
      stopScanning()
    }
  }, [])

  const getCameraDevices = async () => {
    try {
      const devices = await Html5Qrcode.getCameras()
      setCameraDevices(devices)
      if (devices.length > 0) {
        setSelectedCamera(devices[0].id)
      }
    } catch (err) {
      logger.error('Error getting cameras:', err);
      setError('Unable to access camera devices');
    }
  }

  const startScanning = async () => {
    if (!selectedCamera) {
      setError('No camera selected')
      return
    }

    try {
      setError(null)
      const qrCodeScanner = new Html5Qrcode('qr-reader-scanner')
      qrCodeScannerRef.current = qrCodeScanner
      
      await qrCodeScanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccessHandler,
        onScanFailure
      )
      
      setIsScanning(true)
    } catch (err) {
      logger.error('Error starting scanner:', err);
      setError('Failed to start camera. Please check permissions.');
    }
  }

  const stopScanning = async () => {
    if (qrCodeScannerRef.current && isScanning) {
      try {
        await qrCodeScannerRef.current.stop()
        qrCodeScannerRef.current = null
        setIsScanning(false)
      } catch (err) {
        logger.error('Error stopping scanner:', err);
      }
    }
  }

  const onScanSuccessHandler = async (decodedText, decodedResult) => {
    logger.log(`QR Code scanned: ${decodedText}`);
    
    // Stop scanning temporarily while processing
    setVerifying(true);
    
    try {
      // Verify the QR code with backend
      const verificationResult = await verifyQRCode(decodedText)
      
      if (verificationResult) {
        setScanResult(verificationResult)
        
        // Add to history if enabled
        if (showHistory) {
          const scanEntry = {
            id: Date.now(),
            data: verificationResult,
            scannedAt: new Date().toISOString(),
            status: 'success'
          }
          
          const updatedHistory = [scanEntry, ...scanHistory.slice(0, 49)] // Keep last 50 scans
          setScanHistory(updatedHistory)
          localStorage.setItem('qrScanHistory', JSON.stringify(updatedHistory))
        }
        
        // Call success callback
        if (onScanSuccess) {
          onScanSuccess(verificationResult)
        }
      }
    } catch (error) {
      logger.error('QR verification failed:', error);
      const errorEntry = {
        id: Date.now(),
        error: error.message || 'Verification failed',
        rawData: decodedText,
        scannedAt: new Date().toISOString(),
        status: 'error'
      }
      
      setScanResult(errorEntry)
      
      if (onScanError) {
        onScanError(errorEntry)
      }
    } finally {
      setVerifying(false)
    }
  }

  const onScanFailure = (error) => {
    // This is called when QR code is not detected
    // We don't need to log every failure as it's normal
  }

  const verifyQRCode = async (qrData) => {
    try {
      const response = await qrCodeAPI.verifyQRCode(qrData)
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || 'QR verification failed')
      }
    } catch (error) {
      throw error
    }
  }

  const clearResults = () => {
    setScanResult(null)
    setError(null)
  }

  const clearHistory = () => {
    setScanHistory([])
    localStorage.removeItem('qrScanHistory')
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <QrCodeIcon className="h-6 w-6" />
          QR Code Scanner
        </h2>

        {/* Camera Selection */}
        {cameraDevices.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Camera
            </label>
            <div className="relative">
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                disabled={isScanning}
              >
                {cameraDevices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.label || `Camera ${device.id}`}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Scanner Controls */}
        <div className="flex gap-2 mb-4">
          {!isScanning ? (
            <button
              onClick={startScanning}
              disabled={!selectedCamera || verifying}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CameraIcon className="h-4 w-4" />
              Start Scanning
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <StopIcon className="h-4 w-4" />
              Stop Scanning
            </button>
          )}
          
          {(scanResult || error) && (
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Clear Results
            </button>
          )}
        </div>

        {/* Scanner Element */}
        <div className="mb-4">
          <div 
            id="qr-reader-scanner" 
            className="w-full max-w-md mx-auto border-2 border-gray-300 rounded-lg overflow-hidden"
          />
        </div>

        {/* Verification Status */}
        {verifying && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <span className="text-yellow-800">Verifying QR code...</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <XCircleIcon className="h-5 w-5 text-red-500" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Scan Result Display */}
        {scanResult && (
          <div className="mb-4">
            {scanResult.status === 'success' ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800 mb-2">User Verified Successfully</h4>
                    <div className="space-y-1 text-sm text-green-700">
                      <p><strong>Name:</strong> {scanResult.user?.name}</p>
                      <p><strong>PRN:</strong> {scanResult.user?.prn}</p>
                      <p><strong>Department:</strong> {scanResult.user?.department}</p>
                      <p><strong>Year:</strong> {scanResult.user?.year}</p>
                      <p><strong>College:</strong> {scanResult.user?.college}</p>
                      <p><strong>Verified:</strong> {scanResult.user?.isVerified ? 'Yes' : 'No'}</p>
                      <p><strong>Scanned at:</strong> {new Date(scanResult.verifiedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-3">
                  <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-800 mb-2">Verification Failed</h4>
                    <p className="text-sm text-red-700">{scanResult.error}</p>
                    {scanResult.rawData && (
                      <p className="text-xs text-red-600 mt-1">Raw data: {scanResult.rawData}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scan History */}
      {showHistory && scanHistory.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Scan History</h3>
            <button
              onClick={clearHistory}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear History
            </button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {scanHistory.map((entry) => (
              <div
                key={entry.id}
                className={`p-3 rounded-lg border ${
                  entry.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {entry.status === 'success' ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    {entry.status === 'success' ? (
                      <div className="text-sm">
                        <p className="font-medium text-green-900">
                          {entry.data?.user?.name} ({entry.data?.user?.prn})
                        </p>
                        <p className="text-green-700 truncate">
                          {entry.data?.user?.department} - {entry.data?.user?.year}
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <p className="font-medium text-red-900">Verification Failed</p>
                        <p className="text-red-700 truncate">{entry.error}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(entry.scannedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default QRScanner