import React, { useState, useEffect } from 'react'
import { Tab } from '@headlessui/react'
import logger from '../utils/logger'
import { 
  QrCodeIcon, 
  UserIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import UserQRProfile from '../components/UserQRProfile'
import QRScanner from '../components/QRScanner'
import { authAPI, qrCodeAPI } from '../services/api'

const UserManagement = () => {
  const [selectedTab, setSelectedTab] = useState(0)
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [scanResults, setScanResults] = useState([])

  const departments = [
    'Computer Engineering',
    'Information Technology', 
    'Electronics & Computer Science',
    'Cyber Security',
    'Electronics and Telecommunication',
    'Artificial Intelligence and Data Science',
    'Advance Communication and Technology',
    'Very Large Scale Integration',
    'B.VOC AIDS',
    'B.VOC CYSE'
  ]

  const years = ['FY', 'SY', 'TY', 'Final Year']

  const tabs = [
    { name: 'User List', icon: UserIcon },
    { name: 'QR Scanner', icon: QrCodeIcon },
  ]

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, departmentFilter, yearFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getAllStudents({
        limit: 1000,
        page: 1
      })
      
      if (response.success) {
        setUsers(response.data.students || [])
      }
    } catch (error) {
      logger.error('Error fetching users:', error);
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.student_prn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDepartment = !departmentFilter || user.Department === departmentFilter
      const matchesYear = !yearFilter || user.Year === yearFilter

      return matchesSearch && matchesDepartment && matchesYear
    })

    setFilteredUsers(filtered)
  }

  const handleUserClick = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleScanSuccess = (scanData) => {
    logger.log('QR Scan Success:', scanData);
    setScanResults(prev => [scanData, ...prev.slice(0, 49)]);
  }

  const handleScanError = (error) => {
    logger.error('QR Scan Error:', error);
    setScanResults(prev => [error, ...prev.slice(0, 49)]);
  }

  const UserModal = ({ user, isOpen, onClose }) => {
    if (!isOpen || !user) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">User Details & QR Code</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Personal Information</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>PRN:</strong> {user.student_prn}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Department:</strong> {user.Department}</p>
                <p><strong>Year:</strong> {user.Year}</p>
                <p><strong>Type:</strong> {user.type}</p>
                <p><strong>College:</strong> {user.College_name}</p>
                <p><strong>Experience Points:</strong> {user.Exp || 0}</p>
                <p><strong>Verified:</strong> {user.isVerified ? 'Yes' : 'No'}</p>
                <p><strong>Joined:</strong> {new Date(user.CreatedAT).toLocaleDateString()}</p>
              </div>

              {/* Event Registrations */}
              {user.Events_registered && user.Events_registered.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium text-gray-900 mb-2">Event Registrations</h5>
                  <div className="space-y-1 text-sm">
                    {user.Events_registered.map((event, index) => (
                      <p key={index} className="text-gray-600">
                        Event ID: {event.event_id} - Status: {event.Payment_status}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">QR Code</h4>
              <UserQRProfile userId={user._id} size="medium" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage users and their QR codes</p>
          </div>

          {/* Tabs */}
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="flex border-b border-gray-200">
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    `flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      selected
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`
                  }
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels>
              {/* User List Tab */}
              <Tab.Panel className="p-6">
                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>

                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Years</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FunnelIcon className="h-4 w-4" />
                    {filteredUsers.length} of {users.length} users
                  </div>
                </div>

                {/* Users Table */}
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Year
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            QR Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.student_prn}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.Department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.Year}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isVerified
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.isVerified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.qrCode?.url
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.qrCode?.url ? 'Available' : 'Not Generated'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleUserClick(user)}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              >
                                <EyeIcon className="h-4 w-4" />
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-12">
                        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Try adjusting your search criteria.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Tab.Panel>

              {/* QR Scanner Tab */}
              <Tab.Panel className="p-6">
                <QRScanner
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                  showHistory={true}
                />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* User Details Modal */}
        <UserModal
          user={selectedUser}
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false)
            setSelectedUser(null)
          }}
        />
      </div>
    </div>
  )
}

export default UserManagement