/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks on client-side inputs
 */

/**
 * HTML entities to escape
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char]);
};

/**
 * Sanitize user input by removing potentially dangerous characters
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove null bytes and other control characters
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim();
  
  // Remove any characters that shouldn't be in an email
  sanitized = sanitized.replace(/[^a-z0-9@._+-]/g, '');
  
  return sanitized;
};

/**
 * Validate and sanitize PRN (student ID)
 * @param {string} prn - PRN to sanitize
 * @returns {string} - Sanitized PRN
 */
export const sanitizePRN = (prn) => {
  if (typeof prn !== 'string') return '';
  
  // Only allow alphanumeric characters
  return prn.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
};

/**
 * Sanitize name (allow letters, spaces, and common name characters)
 * @param {string} name - Name to sanitize
 * @returns {string} - Sanitized name
 */
export const sanitizeName = (name) => {
  if (typeof name !== 'string') return '';
  
  // Allow letters (including unicode), spaces, hyphens, and apostrophes
  let sanitized = name.replace(/[^a-zA-Z\s'-]/g, '');
  
  // Remove multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
};

/**
 * Sanitize URL parameters
 * @param {string} param - URL parameter to sanitize
 * @returns {string} - Sanitized parameter
 */
export const sanitizeUrlParam = (param) => {
  if (typeof param !== 'string') return '';
  
  return encodeURIComponent(param.trim());
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
export const isValidUrl = (url) => {
  if (typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitize form data object
 * @param {Object} formData - Form data to sanitize
 * @param {Object} rules - Sanitization rules per field
 * @returns {Object} - Sanitized form data
 */
export const sanitizeFormData = (formData, rules = {}) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value !== 'string') {
      sanitized[key] = value;
      continue;
    }
    
    // Apply specific sanitization rules
    switch (rules[key]) {
      case 'email':
        sanitized[key] = sanitizeEmail(value);
        break;
      case 'prn':
        sanitized[key] = sanitizePRN(value);
        break;
      case 'name':
        sanitized[key] = sanitizeName(value);
        break;
      case 'url':
        sanitized[key] = sanitizeUrlParam(value);
        break;
      default:
        sanitized[key] = sanitizeInput(value);
    }
  }
  
  return sanitized;
};

export default {
  escapeHtml,
  sanitizeInput,
  sanitizeEmail,
  sanitizePRN,
  sanitizeName,
  sanitizeUrlParam,
  isValidUrl,
  sanitizeFormData,
};
