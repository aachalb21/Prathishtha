// Production-safe logging utility
const isDevelopment = import.meta.env.NODE_ENV === 'development'

const logger = {
  // Log general messages (only in development)
  log: (...args) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args)
    }
  },
  // Log general info (only in development)
  info: (message, data) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data || '')
    }
  },

  // Log warnings (development and production)
  warn: (message, data) => {
    console.warn(`[WARN] ${message}`, data || '')
  },

  // Log errors (development and production)
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error || '')
  },

  // Log debug info (only in development)
  debug: (message, data) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data || '')
    }
  },
}

export default logger
