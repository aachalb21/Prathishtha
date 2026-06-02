/**
 * Production-safe Logger Utility
 * Prevents sensitive data from being logged in production
 * 
 * Usage:
 * import logger from '@/utils/logger';
 * logger.log('message');       // Only logs in development
 * logger.error('error');       // Logs in both, sanitized in production
 * logger.warn('warning');      // Only logs in development
 * logger.info('info');         // Only logs in development
 * logger.debug('debug');       // Only logs in development
 */

const isDevelopment = process.env.NEXT_PUBLIC_ENV !== 'production';

// Sensitive patterns to redact in production
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /bearer/i,
  /authorization/i,
  /secret/i,
  /key/i,
  /credential/i,
  /session/i,
  /cookie/i,
  /prn/i,
  /email/i,
];

/**
 * Sanitize data for production logging
 * Redacts sensitive information
 */
const sanitizeForProduction = (data) => {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    // Check if string contains sensitive patterns
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(data)) {
        return '[REDACTED]';
      }
    }
    return data;
  }
  
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(sanitizeForProduction);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // Redact sensitive keys
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      sanitized[key] = isSensitive ? '[REDACTED]' : sanitizeForProduction(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Format error for logging
 */
const formatError = (error) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      // Only include stack in development
      ...(isDevelopment && { stack: error.stack }),
    };
  }
  return error;
};

const logger = {
  /**
   * Log general messages (development only)
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log('[DEV]', ...args);
    }
  },

  /**
   * Log debug messages (development only)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * Log info messages (development only)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Log warnings (development only)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Log errors (both environments, sanitized in production)
   * Critical errors should still be logged for monitoring
   */
  error: (...args) => {
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    } else {
      // In production, sanitize and log minimal info
      const sanitizedArgs = args.map(arg => {
        if (arg instanceof Error) {
          return formatError(arg);
        }
        return sanitizeForProduction(arg);
      });
      console.error('[ERROR]', ...sanitizedArgs);
    }
  },

  /**
   * Log API errors with safe formatting
   */
  apiError: (endpoint, error) => {
    if (isDevelopment) {
      console.error(`[API ERROR] ${endpoint}:`, error);
    } else {
      console.error(`[API ERROR] ${endpoint}:`, {
        status: error?.response?.status,
        message: error?.message || 'Unknown error',
      });
    }
  },

  /**
   * Log auth events (development only - sensitive)
   */
  auth: (message, data) => {
    if (isDevelopment) {
      console.log('[AUTH]', message, data);
    }
  },

  /**
   * Log payment events (sanitized in both)
   */
  payment: (message, data) => {
    const safeData = {
      orderId: data?.orderId,
      status: data?.status,
      amount: data?.amount,
      // Never log transaction details
    };
    
    if (isDevelopment) {
      console.log('[PAYMENT]', message, safeData);
    } else {
      console.log('[PAYMENT]', message, safeData);
    }
  },
};

export default logger;
