import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { eventAPI } from '../services/api'
import logger from '../utils/logger'
import MobileRestriction from '../components/MobileRestriction'

export default function EventAttendance() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'present', 'absent'

  useEffect(() => {
    fetchEventData()
  }, [eventId])

  const fetchEventData = async () => {
    try {
      setLoading(true)
      
      // Fetch event details
      const eventData = await eventAPI.getEventById(eventId)
      setEvent(eventData.event)

      // Fetch registrations
      // Assuming getEventRegistrations returns all registrations with attendance status
      const registrationsData = await eventAPI.getEventRegistrations(eventId)
      setRegistrations(registrationsData.registrations || [])
      
    } catch (err) {
      logger.error('Error fetching event attendance data:', err)
      setError('Failed to load attendance data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      await eventAPI.exportEventRegistrations(eventId, 'csv')
    } catch (err) {
      logger.error('Error exporting data:', err)
      // You might want to show a toast here
    }
  }

  // Filter registrations based on search and status
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      (reg.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (reg.prn?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (reg.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    // Assuming 'attended' is the field for attendance status. 
    // If the API allows checking attendance specific to this event, adapted here.
    // Adjust logic based on actual API response structure if needed.
    const isPresent = reg.attended || false 

    if (filterStatus === 'present') return isPresent
    if (filterStatus === 'absent') return !isPresent
    
    return true
  })

  const stats = {
    total: registrations.length,
    present: registrations.filter(r => r.attended).length,
    absent: registrations.filter(r => !r.attended).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
        <div className="text-red-600 text-xl font-semibold mb-4">{error}</div>
        <button 
          onClick={() => navigate('/events')}
          className="text-primary-600 hover:underline"
        >
          Back to Events
        </button>
      </div>
    )
  }

  return (
    <MobileRestriction>
      <div className="w-full max-w-none min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/events')}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Back to Events"
              >
                <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Attendance Log: {event?.event_name}
                </h1>
                <p className="text-gray-500 mt-1">
                  {new Date(event?.event_date).toLocaleDateString()} • {event?.event_catagory}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                  <span className="text-sm text-blue-800 font-medium">Total: {stats.total}</span>
               </div>
               <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                  <span className="text-sm text-green-800 font-medium">Present: {stats.present}</span>
               </div>
               <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                  <span className="text-sm text-red-800 font-medium">Absent: {stats.absent}</span>
               </div>
               
               <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm ml-2"
               >
                 <ArrowDownTrayIcon className="w-5 h-5" />
                 Export CSV
               </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search by name, PRN, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="all">All Registrations</option>
                <option value="present">Present Only</option>
                <option value="absent">Absent Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.length > 0 ? (
                    filteredRegistrations.map((reg) => (
                      <tr key={reg._id || reg.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{reg.name}</div>
                              <div className="text-sm text-gray-500">{reg.prn}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{reg.email}</div>
                          <div className="text-sm text-gray-500">{reg.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{reg.year} - {reg.branch}</div>
                          <div className="text-sm text-gray-500">
                            Reg Date: {reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reg.attended ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <XCircleIcon className="w-4 h-4 mr-1" />
                              Absent
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-sm text-gray-500">
                        No registrations found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Footer / Pagination if needed */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing {filteredRegistrations.length} of {registrations.length} registrations
              </p>
            </div>
          </div>
        </div>
      </div>
    </MobileRestriction>
  )
}
