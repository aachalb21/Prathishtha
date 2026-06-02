import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { generalAPI, authAPI } from '../services/api'
import MobileRestriction from '../components/MobileRestriction'
import logger from '../utils/logger'
import {
  ServerIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  CameraIcon,
  TrophyIcon,
  StarIcon,
  ChartBarIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const { admin, logout, getAllAdmins, getAdminLoginStats } = useAuthStore()
  const navigate = useNavigate()
  const [serverHealth, setServerHealth] = useState(null)
  const [frontendStatus, setFrontendStatus] = useState('checking')
  const [totalAdmins, setTotalAdmins] = useState(0)
  const [totalAdminLogins, setTotalAdminLogins] = useState(0)
  const [studentStats, setStudentStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Redirect EventCoordinator to their specific dashboard
  useEffect(() => {
    if (admin?.role === 'EventCoordinator') {
      navigate('/event-coordinator', { replace: true })
      return
    }
  }, [admin, navigate])

  // Role-based access configuration
  const roleConfig = {
    SuperAdmin: {
      showAllStats: true,
      showAdminManagement: true,
      showStudentData: true,
      showEventManagement: true,
      title: "Super Administrator Dashboard",
      description: "Complete system overview and management access"
    },
    Admin: {
      showAllStats: true,
      showAdminManagement: false,
      showStudentData: true,
      showEventManagement: true,
      title: "Administrator Dashboard",
      description: "System monitoring and student data management"
    },
    Yuva: {
      showAllStats: false,
      showAdminManagement: false,
      showStudentData: true,
      showEventManagement: true,
      eventFocus: 'Yuva',
      title: "Yuva Event Dashboard",
      description: "Manage Yuva event registrations and participants"
    },
    Olympus: {
      showAllStats: false,
      showAdminManagement: false,
      showStudentData: true,
      showEventManagement: true,
      eventFocus: 'Olympus',
      title: "Olympus Event Dashboard",
      description: "Manage Olympus event registrations and participants"
    },
    Aurum: {
      showAllStats: false,
      showAdminManagement: false,
      showStudentData: true,
      showEventManagement: true,
      eventFocus: 'Aurum',
      title: "Aurum Event Dashboard",
      description: "Manage Aurum event registrations and participants"
    },
    Verve: {
      showAllStats: false,
      showAdminManagement: false,
      showStudentData: true,
      showEventManagement: true,
      eventFocus: 'Verve',
      title: "Verve Event Dashboard",
      description: "Manage Verve event registrations and participants"
    },
    Photographer: {
      showAllStats: false,
      showAdminManagement: false,
      showStudentData: false,
      showEventManagement: false,
      title: "Photographer Dashboard",
      description: "Photo management and event coverage tracking"
    },
    none: {
      showAllStats: false,
      showAdminManagement: false,
      showStudentData: false,
      showEventManagement: false,
      title: "Basic Dashboard",
      description: "Limited access - contact SuperAdmin for role assignment"
    }
  }

  const currentRoleConfig = roleConfig[admin?.role] || roleConfig.none

  useEffect(() => {
    fetchDashboardData()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)

    // Check frontend status every 10 seconds
    const frontendInterval = setInterval(() => {
      checkFrontendStatus()
    }, 10000)

    // Initial checks
    checkFrontendStatus()

    return () => {
      clearInterval(interval)
      clearInterval(frontendInterval)
    }
  }, [admin?.role]) // Add role dependency to refetch when role changes

  const checkFrontendStatus = async () => {
    try {
      // Check the main Pratishtha website instead of admin panel
      // Replace with your actual main website URL
      const mainWebsiteUrl = 'http://localhost:3000' // Update this to your main website URL
      
      const response = await fetch(mainWebsiteUrl, { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      setFrontendStatus('online')
    } catch (error) {
      try {
        // Fallback: try with a simple GET request to the root
        const mainWebsiteUrl = 'http://localhost:3000'
        const response = await fetch(`${mainWebsiteUrl}/api/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(3000)
        })
        
        if (response.ok) {
          setFrontendStatus('online')
        } else {
          setFrontendStatus('offline')
        }
      } catch (fallbackError) {
        logger.log('Main website check failed:', fallbackError.message);
        setFrontendStatus('offline');
      }
    }
  }



  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch server health
      const healthData = await generalAPI.getHealth()
      setServerHealth(healthData)
      
      // Fetch admin statistics (for SuperAdmin and Admin roles)
      if (currentRoleConfig.showAllStats) {
        await fetchAdminStats()
      }

      // Fetch student statistics (for roles that can access student data)
      if (currentRoleConfig.showStudentData) {
        await fetchStudentStats()
      }
      
      // Update last updated timestamp
      setLastUpdated(new Date())
    } catch (error) {
      logger.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentStats = async () => {
    try {
      const stats = await authAPI.getStudentStats()
      setStudentStats(stats)
    } catch (error) {
      logger.error('Failed to fetch student statistics:', error);
    }
  }

  const fetchAdminStats = async () => {
    try {
      // Fetch total number of admins using auth store
      const adminsData = await getAllAdmins()
      setTotalAdmins(adminsData.admins?.length || 0)
      logger.log('Dashboard - Admins data:', adminsData);

      // Fetch admin login statistics using auth store
      const loginsData = await getAdminLoginStats()
      setTotalAdminLogins(loginsData.totalLogins || 0)
      logger.log('Dashboard - Login stats:', loginsData);
    } catch (error) {
      logger.error('Failed to fetch admin statistics:', error);
    }
  }

  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      await logout(true) // Pass true to logout from all devices
    } catch (error) {
      logger.error('Logout from all devices failed:', error);
    } finally {
      setLogoutLoading(false)
    }
  }

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <MobileRestriction>
      <div className="w-full max-w-none">
        {/* Welcome Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                {admin?.role === 'SuperAdmin' && <StarIcon className="w-8 h-8 mr-3 text-yellow-500" />}
                {admin?.role === 'Admin' && <ChartBarIcon className="w-8 h-8 mr-3 text-blue-500" />}
                {admin?.role === 'Yuva' && <TrophyIcon className="w-8 h-8 mr-3 text-green-500" />}
                {admin?.role === 'Olympus' && <TrophyIcon className="w-8 h-8 mr-3 text-purple-500" />}
                {admin?.role === 'Aurum' && <TrophyIcon className="w-8 h-8 mr-3 text-yellow-600" />}
                {admin?.role === 'Photographer' && <CameraIcon className="w-8 h-8 mr-3 text-pink-500" />}
                Welcome back, {admin?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                {currentRoleConfig.description}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Your Role</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                admin?.role === 'SuperAdmin' ? 'bg-yellow-100 text-yellow-800' :
                admin?.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                admin?.role === 'Yuva' ? 'bg-green-100 text-green-800' :
                admin?.role === 'Olympus' ? 'bg-purple-100 text-purple-800' :
                admin?.role === 'Aurum' ? 'bg-yellow-100 text-yellow-800' :
                admin?.role === 'Photographer' ? 'bg-pink-100 text-pink-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {admin?.role || 'No Role'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {logoutLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing out from all devices...
                </>
              ) : (
                <>
                  <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                  Sign Out from All Devices
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid - Role-based content */}
      <div className="bg-gray-50 p-6">
        {/* SuperAdmin and Admin - Full Stats */}
        {currentRoleConfig.showAllStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Admins */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAdmins}</p>
                </div>
              </div>
            </div>

            {/* Admin Logins */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Admin Logins</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAdminLogins}</p>
                </div>
              </div>
            </div>

            {/* Server Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ServerIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Backend Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {serverHealth?.status === 'healthy' ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Frontend Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Website Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {frontendStatus === 'online' ? 'Online' : 
                     frontendStatus === 'offline' ? 'Offline' : 'Checking...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Data Stats - For roles with student access */}
        {currentRoleConfig.showStudentData && studentStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{studentStats.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified Students</p>
                  <p className="text-2xl font-bold text-gray-900">{studentStats.verifiedStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Registrations</p>
                  <p className="text-2xl font-bold text-gray-900">{studentStats.recentRegistrations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">With Events</p>
                  <p className="text-2xl font-bold text-gray-900">{studentStats.studentsWithEvents}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event-specific stats for event admins */}
        {currentRoleConfig.eventFocus && studentStats?.eventStats && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {currentRoleConfig.eventFocus} Event Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {studentStats.eventStats
                .filter(event => event._id.toLowerCase().includes(currentRoleConfig.eventFocus.toLowerCase()))
                .map((event, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Event: {event._id}</p>
                      <p className="text-2xl font-bold text-gray-900">{event.registrations}</p>
                      <p className="text-sm text-gray-500">Total Registrations</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600">Paid: {event.completedPayments}</p>
                      <p className="text-sm text-yellow-600">Pending: {event.pendingPayments}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photographer-specific content */}
        {admin?.role === 'Photographer' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <CameraIcon className="w-6 h-6 text-pink-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Photos Uploaded</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Feature coming soon</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Events Covered</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Feature coming soon</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Feature coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No access message for users without roles */}
        {admin?.role === 'none' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 mr-4" />
              <div>
                <h3 className="text-lg font-medium text-yellow-800">Limited Access</h3>
                <p className="text-yellow-700 mt-1">
                  Your account doesn't have a specific role assigned. Please contact the SuperAdmin to get appropriate permissions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions based on role */}
        {(currentRoleConfig.showStudentData || currentRoleConfig.showAdminManagement || currentRoleConfig.showEventManagement) && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentRoleConfig.showStudentData && (
                <a
                  href="/user-data"
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <UserIcon className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">View Students</p>
                      <p className="text-sm text-gray-500">Manage student data</p>
                    </div>
                  </div>
                </a>
              )}

              {currentRoleConfig.showAdminManagement && (
                <a
                  href="/admin-management"
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <UserGroupIcon className="w-8 h-8 text-purple-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Manage Admins</p>
                      <p className="text-sm text-gray-500">Admin accounts</p>
                    </div>
                  </div>
                </a>
              )}

              {currentRoleConfig.showEventManagement && (
                <a
                  href="/events"
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <CalendarIcon className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {currentRoleConfig.eventFocus ? `${currentRoleConfig.eventFocus} Events` : 'Manage Events'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {admin?.role === 'SuperAdmin' || admin?.role === 'Admin' 
                          ? 'Create and manage all events'
                          : 'Create and manage events'}
                      </p>
                    </div>
                  </div>
                </a>
              )}

              {currentRoleConfig.showEventManagement && (
                <a
                  href="/event-coordinator"
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <QrCodeIcon className="w-8 h-8 text-indigo-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Event Coordinator</p>
                      <p className="text-sm text-gray-500">QR Scanner & Attendance</p>
                    </div>
                  </div>
                </a>
              )}

              {(admin?.role === 'SuperAdmin' || admin?.role === 'Admin') && (
                <a
                  href="/transactions"
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <ChartBarIcon className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Transactions</p>
                      <p className="text-sm text-gray-500">View all payments & orders</p>
                    </div>
                  </div>
                </a>
              )}

              {admin?.role === 'Photographer' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 opacity-50">
                  <div className="flex items-center">
                    <CameraIcon className="w-8 h-8 text-pink-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Photo Gallery</p>
                      <p className="text-sm text-gray-500">Coming soon</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </MobileRestriction>
  )
}
