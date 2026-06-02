import { create } from 'zustand'
import { authAPI } from '../services/api'

const useAuthStore = create((set, get) => ({
  // State
  isAuthenticated: false,
  admin: null,
  loading: true,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Login action
  login: async (credentials) => {
    set({ loading: true, error: null })

    try {
      const response = await authAPI.login(credentials)
      
      // Only store the access token, not admin data
      localStorage.setItem('accessToken', response.accessToken)
      
      set({
        isAuthenticated: true,
        admin: response.admin, // Store in Zustand state only
        loading: false,
        error: null,
      })

      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed'
      
      set({
        isAuthenticated: false,
        admin: null,
        loading: false,
        error: errorMessage,
      })

      return { 
        success: false, 
        error: errorMessage,
        code: error.response?.data?.code 
      }
    }
  },

  // Logout action
  logout: async (logoutAll = false) => {
    set({ loading: true, error: null })

    try {
      if (logoutAll) {
        await authAPI.logoutAll()
      } else {
        await authAPI.logout()
      }
    } catch (error) {
      // Don't prevent logout even if API call fails
    }

    // Always clear state and token regardless of API response
    localStorage.removeItem('accessToken')
    
    set({
      isAuthenticated: false,
      admin: null,
      loading: false,
      error: null,
    })
  },

  // Initialize auth state (check if token exists and validate it)
  initializeAuth: async () => {
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      set({ loading: false, isAuthenticated: false })
      return
    }

    try {
      // Try to refresh token to validate it and get admin data
      const response = await authAPI.refreshToken()
      
      // Update the token if a new one was returned
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken)
      }
      
      // Get admin info by making an authenticated request
      const adminInfo = await authAPI.getAdminInfo()
      
      set({
        isAuthenticated: true,
        admin: adminInfo.admin,
        loading: false,
        error: null,
      })
    } catch (error) {
      // Token is invalid, clear it
      localStorage.removeItem('accessToken')
      set({
        isAuthenticated: false,
        admin: null,
        loading: false,
        error: null,
      })
    }
  },

  // Create admin (SuperAdmin only)
  createAdmin: async (adminData) => {
    try {
      const response = await authAPI.createAdmin(adminData)
      return { success: true, data: response }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create admin'
      return { 
        success: false, 
        error: errorMessage,
        details: error.response?.data?.errors || []
      }
    }
  },

  // Create event coordinator (Specific role-based function)
  createEventCoordinator: async (coordinatorData) => {
    try {
      const response = await authAPI.createEventCoordinator(coordinatorData)
      return { success: true, data: response }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create event coordinator'
      return { 
        success: false, 
        error: errorMessage,
        details: error.response?.data?.errors || []
      }
    }
  },

  // Get all admins
  getAllAdmins: async () => {
    try {
      const response = await authAPI.getAllAdmins()
      return response
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admins')
    }
  },

  // Get admin login statistics
  getAdminLoginStats: async () => {
    try {
      const response = await authAPI.getAdminLoginStats()
      return response
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin login stats')
    }
  },
}))

export default useAuthStore
