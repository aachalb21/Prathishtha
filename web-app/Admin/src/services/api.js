import axios from 'axios'
import logger from '../utils/logger'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://pratishtha-api.sakec.ac.in',
  timeout: 10000,
  withCredentials: true, // Temporarily disabled due to CORS - using localStorage instead
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    logger.debug('API Request - Token from localStorage:', token ? 'Present' : 'Not found')
    logger.debug('API Request - URL:', config.url)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      logger.debug('API Request - Authorization header set')
    } else {
      logger.debug('API Request - No token found in localStorage')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the token
        const refreshResponse = await api.post('/admin/refresh-token', {
          platform: 'web'
        })

        const { accessToken } = refreshResponse.data
        
        // Store new token
        localStorage.setItem('accessToken', accessToken)
        
        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        
        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear token and redirect to login
        logger.error('Token refresh failed', refreshError.response?.data?.message)
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Admin Authentication APIs
export const authAPI = {
  // Login admin
  login: async (credentials) => {
    const response = await api.post('/admin/login', {
      ...credentials,
      platform: 'web'
    })
    return response.data
  },

  // Refresh access token
  refreshToken: async () => {
    const response = await api.post('/admin/refresh-token', {
      platform: 'web'
    })
    return response.data
  },

  // Logout from current device
  logout: async () => {
    const response = await api.post('/admin/logout', {
      platform: 'web'
    })
    return response.data
  },

  // Logout from all devices
  logoutAll: async () => {
    const response = await api.post('/admin/logout-all', {
      platform: 'web'
    })
    return response.data
  },

  // Create new admin (SuperAdmin only)
  createAdmin: async (adminData) => {
    const response = await api.post('/admin/create-admin', adminData)
    return response.data
  },

  // Create event coordinator (Role-based function)
  createEventCoordinator: async (coordinatorData) => {
    const response = await api.post('/admin/create-coordinator', coordinatorData)
    return response.data
  },

  // Get all admins
  getAllAdmins: async () => {
    const response = await api.get('/admin/all')
    return response.data
  },

  // Get admin login statistics
  getAdminLoginStats: async () => {
    const response = await api.get('/admin/login-stats')
    return response.data
  },

  // Get current admin info
  getAdminInfo: async () => {
    const response = await api.get('/admin/me')
    return response.data
  },

  // Get student statistics
  getStudentStats: async () => {
    const response = await api.get('/admin/student-stats')
    return response.data
  },

  // Get all students with pagination and filtering
  getAllStudents: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/admin/students?${queryParams}`)
    return response.data
  },

  // Get specific student details
  getStudentDetails: async (studentId) => {
    const response = await api.get(`/admin/students/${studentId}`)
    return response.data
  },

  // Get students by event
  getStudentsByEvent: async (eventId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/admin/events/${eventId}/students?${queryParams}`)
    return response.data
  },
}

// Photographer APIs
export const photographerAPI = {
  // Upload photo with metadata
  uploadPhoto: async (formData) => {
    const response = await api.post('/photographer/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds timeout for large uploads
    })
    return response.data
  },

  // Get all photos with filtering and pagination
  getPhotos: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/photographer/photos?${queryParams}`)
    return response.data
  },

  // Get photo statistics
  getPhotoStats: async () => {
    const response = await api.get('/photographer/photos/stats')
    return response.data
  },

  // Get single photo by ID
  getPhotoById: async (photoId) => {
    const response = await api.get(`/photographer/photos/${photoId}`)
    return response.data
  },

  // Update photo metadata
  updatePhoto: async (photoId, updateData) => {
    const response = await api.put(`/photographer/photos/${photoId}`, updateData)
    return response.data
  },

  // Delete photo (permanent delete by default, soft delete with soft=true)
  deletePhoto: async (photoId, soft = false) => {
    const queryParams = soft ? '?soft=true' : ''
    const response = await api.delete(`/photographer/photos/${photoId}${queryParams}`)
    return response.data
  },

  // Bulk delete photos (permanent delete by default, soft delete with soft=true)
  bulkDeletePhotos: async (photoIds, soft = false) => {
    const queryParams = soft ? '?soft=true' : ''
    const response = await api.delete(`/photographer/photos/bulk${queryParams}`, {
      data: { photoIds }
    })
    return response.data
  },

  // Bulk update photos
  bulkUpdatePhotos: async (photoIds, updates) => {
    const response = await api.patch('/photographer/photos/bulk', {
      photoIds,
      updates
    })
    return response.data
  },

  // Get public photo gallery (active photos only)
  getGallery: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/photographer/gallery?${queryParams}`)
    return response.data
  },

  // Get featured photos
  getFeaturedPhotos: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/photographer/gallery/featured?${queryParams}`)
    return response.data
  },

  // Get photos by category
  getPhotosByCategory: async (category, params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/photographer/gallery/category/${category}?${queryParams}`)
    return response.data
  },

  // Get photos by year
  getPhotosByYear: async (year, params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/photographer/gallery/year/${year}?${queryParams}`)
    return response.data
  },

  // Get photos organized by category and year
  getPhotosOrganizedByCategory: async () => {
    const response = await api.get('/photographer/photos/by-category')
    return response.data
  },

  // Get Cloudinary folder structure
  getFolderStructure: async () => {
    const response = await api.get('/photographer/folders/structure')
    return response.data
  },
}

// General API utilities
export const generalAPI = {
  // Get server health
  getHealth: async () => {
    const response = await axios.get('https://pratishtha-api.sakec.ac.in/health')
    return response.data
  },

  // Get server info
  getServerInfo: async () => {
    const response = await axios.get('https://pratishtha-api.sakec.ac.in')
    return response.data
  },
}

// Event Management APIs
export const eventAPI = {
  // Create new event
  createEvent: async (formData) => {
    const response = await api.post('/events/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds timeout for large uploads
    })
    return response.data
  },

  // Get all events with filtering
  getAllEvents: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/events?${queryParams}`)
    return response.data
  },

  // Get single event by ID
  getEventById: async (eventId) => {
    const response = await api.get(`/events/${eventId}`)
    return response.data
  },

  // Update event
  updateEvent: async (eventId, formData) => {
    logger.log('Updating event:', formData);
    const response = await api.put(`/events/${eventId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Delete event
  deleteEvent: async (eventId) => {
    const response = await api.delete(`/events/${eventId}`)
    return response.data
  },

  // Get event registrations
  getEventRegistrations: async (eventId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/events/${eventId}/registrations?${queryParams}`)
    return response.data
  },

  // Get event statistics
  getEventStats: async (eventId) => {
    const response = await api.get(`/events/${eventId}/stats`)
    return response.data
  },

  // Export event registrations
  exportEventRegistrations: async (eventId, format = 'csv') => {
    const response = await api.get(`/events/${eventId}/export?format=${format}`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Bulk delete events (SuperAdmin and Admin only)
  bulkDeleteEvents: async (eventIds) => {
    const response = await api.post('/events/bulk-delete', { eventIds })
    return response.data
  },

  // Toggle registration status (open/close)
  toggleRegistrationStatus: async (eventId) => {
    const response = await api.patch(`/events/${eventId}/toggle-registration`)
    return response.data
  },

  // Verify event code for coordinator access
  verifyEventCode: async (eventCode) => {
    const response = await api.get(`/events/verify-code/${eventCode}`)
    return response.data
  },

  // Close event (set registration_open to false)
  closeEvent: async (eventId) => {
    const response = await api.patch(`/events/${eventId}/close`)
    return response.data
  },
}

// QR Code APIs
export const qrCodeAPI = {
  // Get user's QR code
  getUserQRCode: async (userId) => {
    const response = await api.get(`/users/qr-code/${userId}`)
    return response.data
  },

  // Download user's QR code as image
  downloadUserQRCode: async (userId) => {
    const response = await api.get(`/users/qr-code/${userId}/download`, {
      responseType: 'blob'
    })
    return response
  },

  // Regenerate user's QR code (requires authentication)
  regenerateQRCode: async (userId) => {
    const response = await api.post(`/users/qr-code/${userId}/regenerate`)
    return response.data
  },

  // Verify QR code data
  verifyQRCode: async (qrData) => {
    const response = await api.post('/users/verify-qr', { qrData })
    return response.data
  },

  // Verify user attendance for event
  verifyUserAttendance: async (userId, eventId) => {
    const response = await api.post('/users/verify-attendance', { userId, eventId })
    return response.data
  },

  // Mark attendance for user
  markAttendance: async (userId, eventId) => {
    const response = await api.post('/users/mark-attendance', { 
      userId, 
      eventId
    })
    return response.data
  },

  // Get user event history
  getUserEventHistory: async (userId) => {
    const response = await api.get(`/users/${userId}/event-history`)
    return response.data
  },
}

// SC Team APIs
export const scTeamAPI = {
  // Add new council member
  addMember: async (formData) => {
    const response = await api.post('/sc-team', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    })
    return response.data
  },

  // Get all council members
  getAllMembers: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/sc-team?${queryParams}`)
    return response.data
  },

  // Get council members grouped by category
  getMembersGrouped: async () => {
    const response = await api.get('/sc-team/grouped')
    return response.data
  },

  // Get single council member
  getMemberById: async (memberId) => {
    const response = await api.get(`/sc-team/${memberId}`)
    return response.data
  },

  // Update council member
  updateMember: async (memberId, formData) => {
    const response = await api.put(`/sc-team/${memberId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    })
    return response.data
  },

  // Delete council member
  deleteMember: async (memberId) => {
    const response = await api.delete(`/sc-team/${memberId}`)
    return response.data
  },
}

// Payment & Transaction APIs
export const paymentAPI = {
  // Get all transactions
  getAllTransactions: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/payments/transactions?${queryParams}`)
    return response.data
  },

  // Get transaction details
  getTransactionDetails: async (transactionId) => {
    const response = await api.get(`/payments/transaction/${transactionId}`)
    return response.data
  },

  // Get transaction summary/stats
  getTransactionSummary: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString()
    const response = await api.get(`/payments/transactions/summary?${queryParams}`)
    return response.data
  },

  // Get order status
  getOrderStatus: async (orderId) => {
    const response = await api.get(`/payments/order/${orderId}`)
    return response.data
  },
}

export default api
