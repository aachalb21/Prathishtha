import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminManagement from './pages/AdminManagement'
import UserData from './pages/UserData'
import EventManagement from './pages/EventManagement'
import TransactionsPage from './pages/TransactionsPage'
import PhotographerDashboard from './pages/PhotographerDashboard'
import EventCoordinatorDashboard from './pages/EventCoordinatorDashboard'
import ScTeamDashboard from './pages/ScTeamDashboard'
import EventAttendance from './pages/EventAttendance'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import './App.css'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuthStore()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Public Route Component (redirect if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuthStore()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <Router>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin-management" 
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminManagement />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/user-data" 
            element={
              <ProtectedRoute>
                <Layout>
                  <UserData />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/events" 
            element={
              <ProtectedRoute>
                <Layout>
                  <EventManagement />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/events/:eventId/attendance" 
            element={
              <ProtectedRoute>
                <Layout>
                  <EventAttendance />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/transactions" 
            element={
              <ProtectedRoute>
                <Layout>
                  <TransactionsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/photographer" 
            element={
              <ProtectedRoute>
                <Layout>
                  <PhotographerDashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sc-team" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ScTeamDashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/event-coordinator" 
            element={
              <ProtectedRoute>
                <EventCoordinatorDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 Route */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-4">Page not found</p>
                  <a 
                    href="/dashboard"
                    className="btn-primary"
                  >
                    Go to Dashboard
                  </a>
                </div>
              </div>
            } 
          />
        </Routes>
    </Router>
  )
}

export default App
