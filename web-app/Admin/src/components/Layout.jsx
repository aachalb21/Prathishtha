import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import logger from '../utils/logger'
import {
  HomeIcon,
  UserGroupIcon,
  UserIcon,
  PhotoIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  UsersIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Admin Management', href: '/admin-management', icon: UserGroupIcon, roles: ['SuperAdmin'] },
  { name: 'Student Data', href: '/user-data', icon: UserIcon, roles: ['SuperAdmin', 'Admin', 'Yuva', 'Olympus', 'Aurum', 'Verve'] },
  { name: 'Event Management', href: '/events', icon: CalendarIcon, roles: ['SuperAdmin', 'Admin', 'Yuva', 'Olympus', 'Aurum', 'Verve'] },
  { name: 'Transactions', href: '/transactions', icon: PhotoIcon, roles: ['SuperAdmin', 'Admin'] },
  { name: 'Event Coordinator', href: '/event-coordinator', icon: QrCodeIcon, roles: ['SuperAdmin', 'Admin', 'Yuva', 'Olympus', 'Aurum', 'Verve'] },
  { name: 'Photo Gallery', href: '/photographer', icon: PhotoIcon, roles: ['SuperAdmin', 'Admin', 'Photographer'] },
  { name: 'SC Team', href: '/sc-team', icon: UsersIcon, roles: ['SuperAdmin', 'Admin', 'Photographer'] },
]

export default function Layout({ children }) {
  const { admin, logout, loading } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // EventCoordinator should use dedicated dashboard without layout
  if (admin?.role === 'EventCoordinator') {
    return children
  }

  const handleLogout = async () => {
    logger.log('Logout button clicked!');
    setLogoutLoading(true);
    setUserMenuOpen(false);
    try {
      await logout();
      logger.log('Logout successful');
      navigate('/login');
    } catch (error) {
      logger.error('Logout failed:', error);
    } finally {
      setLogoutLoading(false)
    }
  }

  const handleLogoutAll = async () => {
    logger.log('Logout all button clicked!');
    setLogoutLoading(true);
    setUserMenuOpen(false);
    try {
      await logout(true);
      navigate('/login');
    } catch (error) {
      logger.error('Logout all failed:', error);
    } finally {
      setLogoutLoading(false)
    }
  }

  // Filter navigation based on admin role
  const filteredNavigation = navigation.filter(item => {
    // Always show dashboard
    if (item.href === '/dashboard') return true
    
    // Check role-based access
    if (item.roles) {
      return item.roles.includes(admin?.role)
    }
    
    // Show by default if no role restriction
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 w-64 h-screen bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:sticky lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center space-x-2">

            <span className="text-xl font-bold font-mael text-golden-rod">Pratishtha</span>
          </Link>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive 
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)} // Close mobile sidebar on navigation
                >
                  <item.icon className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-primary-600' : 'text-gray-400'}
                  `} />
                  {item.name}
                  {item.roles && (
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                      {item.roles.includes('SuperAdmin') ? 'Admin' : 'Event'}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
          
          {/* Quick Actions Section */}
          {/* <div className="pt-4 mt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 px-3">Quick Actions</h3>
            <div className="space-y-2">
              {admin?.role === 'SuperAdmin' && (
                <button onClick={()=>{
                  navigate('/admin-management/create')
                }} className="w-full text-left px-3 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200 font-medium">
                  Create New Admin
                </button>
              )}
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                View All Sessions
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                System Settings
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                Export Data
              </button>
            </div>
          </div> */}
        </nav>

        {/* Admin info at bottom */}
        {/* <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-700 font-medium text-sm">
                {admin?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {admin?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {admin?.role}
              </p>
            </div>
          </div>
        </div> */}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navigation - only show on mobile when sidebar is closed */}
        <div className={`sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200 lg:hidden ${sidebarOpen ? 'hidden' : 'block'}`}>
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                className="text-gray-500 hover:text-gray-700 mr-4"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              
              Page Title/Breadcrumb
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {navigation.find(item => item.href === location.pathname)?.name || 'Admin Panel'}
                </h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Manage your application settings and data
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              User menu
              <div className="relative">
                <button
                  className="flex items-center text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 p-1"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-700 font-medium text-sm">
                      {admin?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <ChevronDownIcon className="ml-2 w-4 h-4 text-gray-500" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
                      <p className="text-xs text-gray-500">{admin?.email}</p>
                      <p className="text-xs text-primary-600 mt-1">Role: {admin?.role}</p>
                    </div>
                    <button
                      type="button"
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      onClick={(e) => {
                        logger.log('Sign out button clicked!', e);
                        e.preventDefault();
                        e.stopPropagation();
                        handleLogout();
                      }}
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
                    <button
                      type="button"
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50"
                      onClick={(e) => {
                        logger.log('Sign out all button clicked!', e);
                        e.preventDefault();
                        e.stopPropagation();
                        handleLogoutAll();
                      }}
                      disabled={logoutLoading}
                    >
                      {logoutLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Signing out...
                        </>
                      ) : (
                        <>
                          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                          Sign out from all devices
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-none p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  )
}
