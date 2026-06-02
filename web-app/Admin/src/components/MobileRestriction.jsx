import React from 'react'
import useMobileDetection from '../hooks/useMobileDetection'

const MobileRestriction = ({ children, allowMobile = false }) => {
  const isMobile = useMobileDetection()

  if (isMobile && !allowMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <svg 
              className="mx-auto h-16 w-16 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Desktop Only
          </h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            This admin dashboard is optimized for desktop use only. For mobile access, please use the Event Coordinator dashboard.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>Mobile users:</strong> If you're an Event Coordinator, please contact your administrator for mobile dashboard access.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Please access this page from a desktop or laptop computer.
          </p>
        </div>
      </div>
    )
  }

  return children
}

export default MobileRestriction