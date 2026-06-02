import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  UserGroupIcon,
  TagIcon,
  PhotoIcon,
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  PlayIcon,
  PauseIcon,
  UserIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import CreateEventModal from '../components/CreateEventModal'
import CreateEventCoordinatorModal from '../components/CreateEventCoordinatorModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import MobileRestriction from '../components/MobileRestriction'
import useAuthStore from '../store/authStore'
import { eventAPI } from '../services/api'
import logger from '../utils/logger'

export default function EventManagement() {
  const { admin } = useAuthStore()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCoordinatorModal, setShowCoordinatorModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, event: null, loading: false })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [copiedEventId, setCopiedEventId] = useState(null)
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false)

  // Role-based access
  const canCreateEvent = ['SuperAdmin', 'Admin', 'Yuva', 'Olympus', 'Aurum', 'Verve'].includes(admin?.role)
  const canCreateEventCoordinator = ['SuperAdmin', 'Admin', 'Yuva', 'Olympus', 'Aurum', 'Verve'].includes(admin?.role)
  
  const categoryFilter = admin?.role === 'SuperAdmin' ? null : // SuperAdmin sees all
                       admin?.role === 'Admin' ? null : // Regular Admin sees all
                       admin?.role === 'Yuva' ? 'Yuva' : 
                       admin?.role === 'Olympus' ? 'Olympus' : 
                       admin?.role === 'Aurum' ? 'Aurum' :
                       admin?.role === 'Verve' ? 'Verve' : null

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        search: searchTerm,
        eventType: filterType,
        limit: 10000 // Set a very high limit to fetch all events
      }
      // Only add category filter if it exists and is not null
      if (categoryFilter) {
        params.category = categoryFilter
      }
      // For manual category filtering (when user selects from dropdown)
      if (filterCategory) {
        params.category = filterCategory
      }
      logger.log('Fetching events with params:', params);
      const data = await eventAPI.getAllEvents(params)
      logger.log('Events received:', data);
      setEvents(data.events || [])
    } catch (error) {
      logger.error('Failed to fetch events:', error);
      setError(`Failed to fetch events: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async (eventData) => {
    try {
      const newEvent = await eventAPI.createEvent(eventData)
      setEvents([newEvent.event, ...events])
      setShowCreateModal(false)
    } catch (error) {
      logger.error('Failed to create event:', error);
      throw error // Re-throw to handle in modal
    }
  }

  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setShowCreateModal(true)
  }

  const handleUpdateEvent = async (eventData) => {
    try {
      logger.log('Sending update request for event:', editingEvent._id);
      logger.log('Update data:', eventData);
      
      const updatedEvent = await eventAPI.updateEvent(editingEvent._id, eventData)
      logger.log('Update response:', updatedEvent);
      
      if (updatedEvent.event) {
        setEvents(events.map(event => 
          event._id === editingEvent._id ? updatedEvent.event : event
        ))
      }
      setEditingEvent(null)
      setShowCreateModal(false)
    } catch (error) {
      logger.error('Failed to update event:', error);
      logger.error('Error details:', error.response?.data);
      throw error // Re-throw to handle in modal
    }
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    setEditingEvent(null)
  }

  const handleDeleteEvent = async (event) => {
    setDeleteModal({ isOpen: true, event, loading: false })
  }

  const confirmDeleteEvent = async () => {
    const { event } = deleteModal
    
    try {
      setDeleteModal(prev => ({ ...prev, loading: true }))
      await eventAPI.deleteEvent(event._id)
      
      // Remove the deleted event from the local state
      setEvents(events.filter(e => e._id !== event._id))
      
      // Close modal and show success (you could also use a toast notification here)
      setDeleteModal({ isOpen: false, event: null, loading: false })
      logger.log(`Event "${event.event_name}" deleted successfully`);
      
    } catch (error) {
      logger.error('Failed to delete event:', error);
      setError(`Failed to delete event: ${error.message || 'Unknown error'}`);
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  const handleCopyEventId = async (eventId) => {
    try {
      await navigator.clipboard.writeText(eventId)
      setCopiedEventId(eventId)
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedEventId(null)
      }, 2000)
    } catch (error) {
      logger.error('Failed to copy event ID:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = eventId
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedEventId(eventId)
        setTimeout(() => {
          setCopiedEventId(null)
        }, 2000)
      } catch (fallbackError) {
        logger.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea)
    }
  }

  const handleToggleRegistration = async (event) => {
    try {
      const response = await eventAPI.toggleRegistrationStatus(event._id)
      
      // Update the local state
      setEvents(events.map(e => 
        e._id === event._id 
          ? { ...e, registration_open: response.registration_open }
          : e
      ))
      
      logger.log(`Registration ${response.registration_open ? 'opened' : 'closed'} for event: ${event.event_name}`);
      
    } catch (error) {
      logger.error('Failed to toggle registration:', error);
      setError(`Failed to toggle registration: ${error.message || 'Unknown error'}`);
    }
  }

  const handleUpdateAllStatuses = async () => {
    if (!events.length) return

    const now = new Date()
    setBulkUpdateLoading(true)

    try {
      const updatedEvents = await Promise.all(events.map(async (event) => {
        const registrationExpired = event.registration_end_date && new Date(event.registration_end_date) < now

        if (registrationExpired && event.registration_open) {
          try {
            const response = await eventAPI.toggleRegistrationStatus(event._id)
            return { ...event, registration_open: response.registration_open }
          } catch (error) {
            logger.error(`Failed to update registration for ${event._id}:`, error);
            return event
          }
        }

        return event
      }))

      setEvents(updatedEvents)
    } catch (error) {
      logger.error('Failed to update all statuses:', error);
      setError('Failed to update all statuses');
    } finally {
      setBulkUpdateLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.event_description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || event.event_catagory === filterCategory
    const matchesType = !filterType || event.event_type === filterType
    return matchesSearch && matchesCategory && matchesType
  })

  const getEventStatusColor = (event) => {
    if (!event?.event_date) return 'bg-gray-100 text-gray-800'
    const eventDate = new Date(event.event_date)
    const now = new Date()
    return eventDate < now ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
  }

  const getEventStatusText = (event) => {
    if (!event?.event_date) return 'Unknown'
    const eventDate = new Date(event.event_date)
    const now = new Date()
    return eventDate < now ? 'Completed' : 'Upcoming'
  }

  const getRegistrationStatusColor = (event) => {
    if (event.registration_open) {
      return 'bg-green-100 text-green-800'
    } else {
      return 'bg-red-100 text-red-800'
    }
  }

  const getRegistrationStatusText = (event) => {
    if (event.registration_open) {
      return 'Registration Open'
    } else {
      return 'Registration Closed'
    }
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
      <div className="w-full max-w-none text-black">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <CalendarIcon className="w-8 h-8 mr-3 text-blue-600" />
                Event Management
                {categoryFilter && (
                  <span className="ml-2 text-lg text-gray-600">- {categoryFilter} Events</span>
              )}
              {(admin?.role === 'SuperAdmin' || admin?.role === 'Admin') && (
                <span className="ml-2 text-lg text-gray-600">- All Events</span>
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              {categoryFilter 
                ? `Create and manage ${categoryFilter} events`
                : (admin?.role === 'SuperAdmin' || admin?.role === 'Admin') 
                  ? 'Create and manage all festival events'
                  : 'Create and manage festival events'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {admin?.role === 'SuperAdmin' && (
              <button
                onClick={handleUpdateAllStatuses}
                disabled={bulkUpdateLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CogIcon className="w-4 h-4 mr-2" />
                {bulkUpdateLoading ? 'Updating...' : 'Update All Statuses'}
              </button>
            )}
            {canCreateEventCoordinator && (
              <button
                onClick={() => setShowCoordinatorModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Create Event Coordinator
              </button>
            )}
            {canCreateEvent && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Event
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-6 border-b">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Events
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Category filter - show for SuperAdmin and Admin */}
          {(admin?.role === 'SuperAdmin' || admin?.role === 'Admin') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Aurum">Aurum</option>
                <option value="Olympus">Olympus</option>
                <option value="Yuva">Yuva</option>
                <option value="Verve">Verve</option>
              </select>
            </div>
          )}
          
          {/* Show current filter for category-specific admins */}
          {categoryFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={categoryFilter}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-600"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="Flagship">Flagship</option>
                <option value="Inter-college">Inter-college</option>
                <option value="Intra-college">Intra-college</option>
                <option value="Casual">Casual</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchEvents}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {filteredEvents.length === 0 && !error ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {canCreateEvent ? 'Get started by creating a new event.' : 'No events available.'}
            </p>
            {canCreateEvent && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Event
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Event Image */}
                {event.event_poster && (
                  <div className="h-48 bg-gray-200 relative">
                    <img
                      src={event.event_poster}
                      alt={event.event_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {event.event_name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mb-2 space-x-2">
                        <TagIcon className="w-4 h-4 mr-1" />
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          event.event_catagory === 'Aurum' ? 'bg-yellow-100 text-yellow-800' :
                          event.event_catagory === 'Olympus' ? 'bg-purple-100 text-purple-800' :
                          event.event_catagory === 'Yuva' ? 'bg-green-100 text-green-800' :
                          event.event_catagory === 'Verve' ? 'bg-pink-100 text-pink-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.event_catagory}
                        </span>
                        
                        {/* Registration Status */}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRegistrationStatusColor(event)}`}>
                          {getRegistrationStatusText(event)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <UserGroupIcon className="w-4 h-4 mr-2" />
                      {event.team_type} ({event.team_size} member{event.team_size > 1 ? 's' : ''})
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <TagIcon className="w-4 h-4 mr-2" />
                      {event.event_type}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 h-4 mr-2">💰</span>
                      <span className="font-medium">
                        {event.event_fee && event.event_fee > 0 ? `₹${event.event_fee}` : 'Free'}
                      </span>
                    </div>
                  </div>

                  {/* Event Description */}
                  {event.event_description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {event.event_description}
                    </p>
                  )}

                  {/* Status Management Buttons */}
                  {canCreateEvent && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">Registration Control:</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Registration Toggle */}
                          <button
                            onClick={() => handleToggleRegistration(event)}
                            className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                              event.registration_open 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={event.registration_open ? 'Close Registration' : 'Open Registration'}
                          >
                            {event.registration_open ? (
                              <>
                                <PauseIcon className="w-4 h-4 mr-1.5" />
                                Close Registration
                              </>
                            ) : (
                              <>
                                <PlayIcon className="w-4 h-4 mr-1.5" />
                                Open Registration
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View Details
                      </button>

                      <button
                        onClick={() => navigate(`/events/${event._id}/attendance`)}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        <ClipboardDocumentListIcon className="w-4 h-4 mr-1" />
                        Attendance
                      </button>
                      
                      <button
                        onClick={() => handleCopyEventId(event.event_id || event._id)}
                        className={`inline-flex items-center px-2 py-1.5 text-sm rounded transition-colors ${
                          copiedEventId === (event.event_id || event._id)
                            ? 'text-green-600 bg-green-50' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                        title={copiedEventId === (event.event_id || event._id) ? 'Copied!' : 'Copy Event ID'}
                      >
                        {copiedEventId === (event.event_id || event._id) ? (
                          <ClipboardDocumentCheckIcon className="w-4 h-4" />
                        ) : (
                          <ClipboardIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {canCreateEvent && (
                        <>
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="inline-flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event)}
                            className="inline-flex items-center px-2 py-1 text-sm text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
          defaultCategory={categoryFilter}
          eventToEdit={editingEvent}
        />
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Event Details
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedEvent.event_name}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedEvent.event_description}</p>
              </div>

              {/* Event ID Section */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Event ID:</label>
                    <p className="text-sm text-gray-900 font-mono break-all">{selectedEvent.event_id || selectedEvent._id}</p>
                    {selectedEvent.event_id && (
                      <p className="text-xs text-gray-500 mt-1">Database ID: {selectedEvent._id}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopyEventId(selectedEvent.event_id || selectedEvent._id)}
                    className={`inline-flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      copiedEventId === (selectedEvent.event_id || selectedEvent._id)
                        ? 'text-green-600 bg-green-100' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                    }`}
                    title={copiedEventId === (selectedEvent.event_id || selectedEvent._id) ? 'Copied!' : 'Copy Event ID'}
                  >
                    {copiedEventId === (selectedEvent.event_id || selectedEvent._id) ? (
                      <>
                        <ClipboardDocumentCheckIcon className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Event Status Section */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Event Status:</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${getEventStatusColor(selectedEvent)}`}>
                      {getEventStatusText(selectedEvent)}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Registration:</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${getRegistrationStatusColor(selectedEvent)}`}>
                      {getRegistrationStatusText(selectedEvent)}
                    </span>
                  </div>
                </div>
                
                {(selectedEvent.max_participants || selectedEvent.current_participants) && (
                  <div className="mt-2 text-xs text-gray-500">
                    Participants: {selectedEvent.current_participants || 0}
                    {selectedEvent.max_participants && ` / ${selectedEvent.max_participants}`}
                    {selectedEvent.max_participants ? ' (limit set)' : ' (unlimited)'}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Date:</label>
                  <p className="text-sm text-gray-900">{new Date(selectedEvent.event_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Category:</label>
                  <p className="text-sm text-gray-900">{selectedEvent.event_catagory}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Type:</label>
                  <p className="text-sm text-gray-900">{selectedEvent.event_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Team Size:</label>
                  <p className="text-sm text-gray-900">{selectedEvent.team_size} ({selectedEvent.team_type})</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Event Fee:</label>
                  <p className="text-sm text-gray-900 font-medium">
                    {selectedEvent.event_fee && selectedEvent.event_fee > 0 ? `₹${selectedEvent.event_fee}` : 'Free'}
                  </p>
                </div>
              </div>

              {selectedEvent.rulebook_drive_link && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Rulebook:</label>
                  <div className="text-sm text-gray-900 mt-1">
                    <a 
                      href={selectedEvent.rulebook_drive_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 underline"
                    >
                      📄 View Rulebook PDF
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}

              {selectedEvent.event_coordinators && selectedEvent.event_coordinators.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Coordinators:</label>
                  <div className="mt-1">
                    {selectedEvent.event_coordinators.map((coord, index) => (
                      <div key={index} className="text-sm text-gray-900">
                        {coord.name} - {coord.contact}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, event: null, loading: false })}
        onConfirm={confirmDeleteEvent}
        loading={deleteModal.loading}
        title="Delete Event"
        message={deleteModal.event ? (
          <div>
            <p className="font-medium mb-2">Are you sure you want to delete "{deleteModal.event.event_name}"?</p>
            <p className="text-left">This action will:</p>
            <ul className="text-left list-disc list-inside mt-2 space-y-1">
              <li>Remove the event from the database</li>
              <li>Delete the event poster from cloud storage</li>
              <li>Remove all associated data</li>
            </ul>
            <p className="mt-2 font-medium text-red-600">This cannot be undone!</p>
          </div>
        ) : ''}
        confirmText="Delete Event"
      />

      {/* Create Event Coordinator Modal */}
      <CreateEventCoordinatorModal
        isOpen={showCoordinatorModal}
        onClose={() => setShowCoordinatorModal(false)}
        onSuccess={() => {
          logger.log('Event coordinator created successfully');
          // You could show a success toast here
        }}
      />
    </div>
    </MobileRestriction>
  )
}