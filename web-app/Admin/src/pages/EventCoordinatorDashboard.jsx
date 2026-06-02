import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import logger from '../utils/logger'
import { 
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CameraIcon,
  StopIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import useAuthStore from '../store/authStore'
import { eventAPI, qrCodeAPI } from '../services/api'

export default function EventCoordinatorDashboard() {
  const { admin, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [scanHistory, setScanHistory] = useState([])
  const [error, setError] = useState(null)
  const [cameraDevices, setCameraDevices] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [eventCode, setEventCode] = useState('')
  const [currentEvent, setCurrentEvent] = useState(null)
  const [eventCodeLoading, setEventCodeLoading] = useState(false)
  const [eventCodeError, setEventCodeError] = useState(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceError, setAttendanceError] = useState(null)
  const [fetchingUserData, setFetchingUserData] = useState(false)
  const scannerRef = useRef(null)
  const qrCodeScannerRef = useRef(null)
  
  useEffect(() => {
    // Get available camera devices
    getCameraDevices()
    
    // Load scan history from localStorage
    const savedHistory = localStorage.getItem('scanHistory')
    if (savedHistory) {
      setScanHistory(JSON.parse(savedHistory))
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
      const qrCodeScanner = new Html5Qrcode('qr-reader')
      qrCodeScannerRef.current = qrCodeScanner
      
      await qrCodeScanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
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

  const onScanSuccess = (decodedText, decodedResult) => {
    logger.log(`QR Code scanned: ${decodedText}`);

    // Stop scanning after successful scan
    stopScanning();
    
    // Process the scanned data and fetch user info
    processScanResult(decodedText)
  }

  const onScanFailure = (error) => {
    // This is called when QR code is not detected
    // We don't need to log every failure as it's normal
  }

  const processScanResult = async (data) => {
    setFetchingUserData(true)
    setError(null)
    
    try {
      // Parse QR code data
      let parsedData
      try {
        parsedData = JSON.parse(data)
      } catch (e) {
        // If not JSON, treat as plain text (e.g., user ID)
        parsedData = {
          userId: data,
          timestamp: new Date().toISOString()
        }
      }

      // Extract userId from QR data
      const userId = parsedData.userId
      
      if (!userId) {
        throw new Error('Invalid QR code: No user ID found')
      }

      if (!currentEvent || !currentEvent.event_id) {
        throw new Error('No event selected')
      }

      // Verify user attendance and registration for this event
      const response = await qrCodeAPI.verifyUserAttendance(userId, currentEvent.event_id)
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to verify user attendance')
      }

      // Extract user data from response
      const userData = response.data.user
      const canGivePoints = response.data.canGivePoints
      
      // Create scan entry with fetched user data
      const scanEntry = {
        id: Date.now(),
        data: {
          userId: userData.id,
          registrationId: userData.prn,
          name: userData.name,
          email: userData.email || 'N/A',
          phone: userData.phone || 'N/A',
          year: userData.year || 'N/A',
          branch: userData.branch || 'N/A',
          isRegistered: userData.isRegistered,
          canGivePoints: canGivePoints,
          qrData: parsedData
        },
        scannedAt: new Date().toISOString(),
        scannedBy: admin?.name || 'Unknown',
        status: canGivePoints ? 'success' : 'warning'
      }

      setScanResult(scanEntry)
      
      // Add to history
      const updatedHistory = [scanEntry, ...scanHistory.slice(0, 49)] // Keep last 50 scans
      setScanHistory(updatedHistory)
      
      // Save to localStorage
      localStorage.setItem('scanHistory', JSON.stringify(updatedHistory))
      
      // Show attendance modal only if user is registered
      if (canGivePoints) {
        setShowAttendanceModal(true)
      } else {
        setError('User is not registered for this event. Cannot mark attendance.')
      }
      
    } catch (err) {
      logger.error('Error processing scan result:', err);
      const errorEntry = {
        id: Date.now(),
        data: { 
          error: err.message || 'Failed to fetch user data', 
          rawData: data 
        },
        scannedAt: new Date().toISOString(),
        scannedBy: admin?.name || 'Unknown',
        status: 'error'
      }
      setScanResult(errorEntry)
      setError(err.message || 'Failed to fetch user data. Please try again.')
      
      // Add error to history
      const updatedHistory = [errorEntry, ...scanHistory.slice(0, 49)]
      setScanHistory(updatedHistory)
      localStorage.setItem('scanHistory', JSON.stringify(updatedHistory))
    } finally {
      setFetchingUserData(false)
    }
  }

  const clearHistory = () => {
    setScanHistory([])
    localStorage.removeItem('scanHistory')
  }

  const exportHistory = () => {
    const dataStr = JSON.stringify(scanHistory, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `scan-history-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleLogout = async () => {
    setLogoutLoading(true)
    setUserMenuOpen(false)
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      logger.error('Logout failed:', error);
    } finally {
      setLogoutLoading(false)
    }
  }

  const handleEventCodeSubmit = async (e) => {
    e.preventDefault()
    if (!eventCode.trim()) {
      setEventCodeError('Please enter an event code')
      return
    }

    setEventCodeLoading(true)
    setEventCodeError(null)

    try {
      // Verify event code with backend
      const response = await eventAPI.verifyEventCode(eventCode)
      
      if (response.success && response.event) {
        const eventData = response.event
        
        setCurrentEvent(eventData)
        
        // Store in localStorage for persistence
        localStorage.setItem('currentEventCode', eventCode)
        localStorage.setItem('currentEvent', JSON.stringify(eventData))
      } else {
        setEventCodeError(response.message || 'Invalid event code')
      }
      
    } catch (error) {
      logger.error('Error verifying event code:', error);
      // Show the specific error message from the backend
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.details ||
                          'Invalid event code or you do not have access to this event'
      setEventCodeError(errorMessage)
    } finally {
      setEventCodeLoading(false)
    }
  }

  const clearEventAccess = () => {
    setCurrentEvent(null)
    setEventCode('')
    localStorage.removeItem('currentEventCode')
    localStorage.removeItem('currentEvent')
    setScanHistory([])
    localStorage.removeItem('scanHistory')
  }

  useEffect(() => {
    // Restore event access from localStorage
    const savedEventCode = localStorage.getItem('currentEventCode')
    const savedEvent = localStorage.getItem('currentEvent')
    
    if (savedEventCode && savedEvent) {
      setEventCode(savedEventCode)
      setCurrentEvent(JSON.parse(savedEvent))
    }
  }, [])

  const handleMarkAttendance = async () => {
    if (!scanResult || !scanResult.data.userId) {
      setAttendanceError('Invalid scan data. Please scan again.')
      return
    }

    if (!scanResult.data.canGivePoints) {
      setAttendanceError('User is not registered for this event')
      return
    }

    setAttendanceLoading(true)
    setAttendanceError(null)

    try {
      // Call backend API to mark attendance
      const response = await qrCodeAPI.markAttendance(scanResult.data.userId, currentEvent.event_id)
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to mark attendance')
      }

      // Close modal and reset
      setShowAttendanceModal(false)
      setAttendanceError(null)
      
      // Show success message
      alert(`Attendance marked successfully for ${scanResult.data.name}!`)
      
    } catch (error) {
      logger.error('Error marking attendance:', error);
      setAttendanceError(error.response?.data?.message || error.message || 'Failed to mark attendance. Please try again.');
    } finally {
      setAttendanceLoading(false)
    }
  }

  const handleCloseAttendanceModal = () => {
    setShowAttendanceModal(false)
    setAttendanceError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Coordinator Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {admin?.name}</p>
              {currentEvent && (
                <p className="text-sm text-primary-600 mt-1">
                  Managing: <span className="font-semibold">{currentEvent.event_name}</span>
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium text-primary-600">{admin?.role}</p>
              </div>
              
              {/* User menu */}
              <div className="relative">
                <button
                  className="flex items-center text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 p-1"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <ChevronDownIcon className="ml-2 w-4 h-4 text-gray-500" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
                      <p className="text-xs text-gray-500">{admin?.email}</p>
                      <p className="text-xs text-primary-600 mt-1">Role: {admin?.role}</p>
                    </div>
                    <button
                      type="button"
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      onClick={handleLogout}
                      disabled={logoutLoading}
                    >
                      {logoutLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Signing out...
                        </>
                      ) : (
                        <>
                          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                          Sign out
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Code Input Section */}
        {!currentEvent ? (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <div className="max-w-md mx-auto text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCodeIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Enter Event Code</h2>
              <p className="text-gray-600 mb-6">
                Enter the unique event code provided to you to access the event management tools
              </p>
              
              <form onSubmit={handleEventCodeSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value)}
                    placeholder="Enter event code (e.g., EVT-12345)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-lg tracking-wider text-black font-semibold"
                    disabled={eventCodeLoading}
                  />
                </div>
                
                {eventCodeError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{eventCodeError}</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={eventCodeLoading || !eventCode.trim()}
                  className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {eventCodeLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Access Event'
                  )}
                </button>
              </form>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Don't have an event code? Contact your event administrator.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Event Info Banner */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-sm p-6 mb-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      {currentEvent.event_catagory}
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      {currentEvent.team_type}
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      {currentEvent.event_type}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{currentEvent.event_name}</h3>
                  <p className="text-primary-100 flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Event Code: {currentEvent.event_id}
                  </p>
                </div>
                <button
                  onClick={clearEventAccess}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center text-sm"
                >
                  <XCircleIcon className="w-4 h-4 mr-2" />
                  Exit Event
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Scanner Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <QrCodeIcon className="w-5 h-5 mr-2 text-primary-600" />
                QR Code Scanner
              </h2>
              {scanHistory.length > 0 && (
                <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                  {scanHistory.length} scanned
                </span>
              )}
            </div>

            {/* Camera Selection */}
            {cameraDevices.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Camera
                </label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isScanning}
                >
                  {cameraDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.label || `Camera ${device.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Scanner Controls */}
            <div className="mb-4 flex space-x-3">
              {!isScanning ? (
                <button
                  onClick={startScanning}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                  disabled={!selectedCamera}
                >
                  <CameraIcon className="w-4 h-4 mr-2" />
                  Start Scanning
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <StopIcon className="w-4 h-4 mr-2" />
                  Stop Scanning
                </button>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh Camera"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Loading User Data */}
            {fetchingUserData && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-blue-700 font-medium">Fetching user data...</span>
                </div>
              </div>
            )}

            {/* QR Scanner */}
            <div className="relative">
              <div 
                id="qr-reader" 
                className="w-full border-2 border-gray-200 rounded-lg overflow-hidden"
                style={{ minHeight: '300px' }}
              ></div>
              {!isScanning && (
                <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCodeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Click "Start Scanning" to begin</p>
                  </div>
                </div>
              )}
            </div>

            {/* Latest Scan Result */}
            {scanResult && (
              <div className={`mt-4 p-3 rounded-lg border ${
                scanResult.status === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center">
                  {scanResult.status === 'success' ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
                  )}
                  <span className={`font-medium ${
                    scanResult.status === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {scanResult.status === 'success' ? 'Successfully Scanned' : 'Scan Error'}
                  </span>
                </div>
                <div className="mt-2 text-sm">
                  <pre className="whitespace-pre-wrap text-gray-700">
                    {JSON.stringify(scanResult.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Scan History Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <ClockIcon className="w-5 h-5 mr-2 text-primary-600" />
                Recent Scans
              </h2>
              <div className="flex space-x-2">
                {scanHistory.length > 0 && (
                  <>
                    <button
                      onClick={exportHistory}
                      className="text-sm text-primary-600 hover:text-primary-700 transition-colors px-3 py-1 border border-primary-200 rounded"
                    >
                      Export
                    </button>
                    <button
                      onClick={clearHistory}
                      className="text-sm text-red-600 hover:text-red-700 transition-colors px-3 py-1 border border-red-200 rounded"
                    >
                      Clear All
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scanHistory.length === 0 ? (
                <div className="text-center py-8">
                  <QrCodeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No scans yet</p>
                  <p className="text-sm text-gray-400">Scanned QR codes will appear here</p>
                </div>
              ) : (
                scanHistory.map((scan) => (
                  <div 
                    key={scan.id} 
                    className={`p-3 rounded-lg border ${
                      scan.status === 'success' 
                        ? 'border-green-200 bg-green-50' 
                        : scan.status === 'warning'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        {scan.status === 'success' ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        ) : scan.status === 'warning' ? (
                          <XCircleIcon className="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {scan.data.name || scan.data.registrationId || 'Unknown'}
                          </p>
                          {scan.data.name && scan.data.registrationId && (
                            <p className="text-xs text-gray-500">PRN: {scan.data.registrationId}</p>
                          )}
                          {scan.status === 'warning' && (
                            <p className="text-xs text-yellow-700 mt-1">Not registered for this event</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {new Date(scan.scannedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {scan.data.error && (
                      <p className="text-xs text-red-600 mt-1">{scan.data.error}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {currentEvent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {scanHistory.filter(s => s.status === 'success').length}
                </p>
                <p className="text-gray-600">Successful Scans</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {scanHistory.filter(s => s.status === 'error').length}
                </p>
                <p className="text-gray-600">Failed Scans</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {new Date().toLocaleDateString()}
                </p>
                <p className="text-gray-600">Today's Date</p>
              </div>
            </div>
          </div>
        </div>
        )}
          </>
        )}
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && scanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleCloseAttendanceModal}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Mark Attendance</h3>
              <button
                onClick={handleCloseAttendanceModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">Successfully Scanned</span>
                </div>
                <div className="mt-2 space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span className="text-right">{scanResult.data.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">PRN:</span>
                    <span className="text-right">{scanResult.data.registrationId || 'N/A'}</span>
                  </div>
                  {scanResult.data.email && (
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span className="text-right text-xs">{scanResult.data.email}</span>
                    </div>
                  )}
                  {scanResult.data.phone && (
                    <div className="flex justify-between">
                      <span className="font-medium">Phone:</span>
                      <span className="text-right">{scanResult.data.phone}</span>
                    </div>
                  )}
                  {scanResult.data.year && scanResult.data.branch && (
                    <div className="flex justify-between">
                      <span className="font-medium">Class:</span>
                      <span className="text-right">{scanResult.data.year} - {scanResult.data.branch}</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Event: <span className="font-medium">{currentEvent?.event_name || 'Unknown Event'}</span>
              </p>

              {attendanceError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{attendanceError}</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCloseAttendanceModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                disabled={attendanceLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAttendance}
                disabled={attendanceLoading}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {attendanceLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Mark Attendance'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}