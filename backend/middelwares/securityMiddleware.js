import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import crypto from 'crypto';

// ===== REQUEST ID MIDDLEWARE =====

/**
 * Add unique request ID for tracking and debugging
 */
export const requestIdMiddleware = (req, res, next) => {
    req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    next();
};

// ===== RATE LIMITING CONFIGURATIONS =====

// Rate limiting configurations
export const createRateLimiter = (windowMs, max, message, skipSuccessfulRequests = false) => {
	return rateLimit({
		windowMs,
		max,
		message: {
			error: message,
			retryAfter: Math.ceil(windowMs / 1000)
		},
		standardHeaders: true,
		legacyHeaders: false,
		skipSuccessfulRequests,
		skip: (req) => {
			// Disable rate limiting only in development for testing
			// In production, rate limiting is ALWAYS enforced
			return process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT !== 'false';
		},
		// Use default keyGenerator which properly handles IPv6
		// No custom keyGenerator needed - express-rate-limit handles it
        handler: (req, res, next, options) => {
            // Log rate limit violations
            console.warn(`Rate limit exceeded: ${req.ip} - ${req.path}`);
            res.status(429).json(options.message);
        },
		// Disable the IPv6 validation since we're using default keyGenerator
		validate: {
			xForwardedForHeader: false,
		}
	});
};

// Authentication rate limiter (stricter)
export const authLimiter = createRateLimiter(
	15 * 60 * 1000, // 15 minutes
	5, // 5 attempts per window
	'Too many authentication attempts. Please try again in 15 minutes.',
	false
);

// General API rate limiter (more lenient)
export const apiLimiter = createRateLimiter(
	15 * 60 * 1000, // 15 minutes
	100, // 100 requests per window
	'Too many API requests. Please try again in 15 minutes.',
	true
);

// Refresh token rate limiter (moderate)
export const refreshLimiter = createRateLimiter(
	5 * 60 * 1000, // 5 minutes
	10, // 10 refresh attempts per window
	'Too many token refresh attempts. Please try again in 5 minutes.',
	false
);

// Admin creation rate limiter (very strict)
export const adminCreationLimiter = createRateLimiter(
	60 * 60 * 1000, // 1 hour
	3, // 3 admin creations per hour
	'Too many admin creation attempts. Please try again in 1 hour.',
	false
);

// Brute force protection for login attempts (simplified)
export const bruteForceProtection = createRateLimiter(
	60 * 60 * 1000, // 1 hour
	10, // 10 attempts per IP per hour
	'Too many failed login attempts. Please try again in 1 hour.'
);

// Photo upload rate limiter (moderate)
export const uploadLimiter = createRateLimiter(
	15 * 60 * 1000, // 15 minutes
	20, // 20 uploads per window
	'Too many upload attempts. Please try again in 15 minutes.',
	false
);

// Photo update rate limiter (moderate)
export const updateLimiter = createRateLimiter(
	5 * 60 * 1000, // 5 minutes
	30, // 30 updates per window
	'Too many update attempts. Please try again in 5 minutes.',
	true
);

// Photo delete rate limiter (strict)
export const deleteLimiter = createRateLimiter(
	10 * 60 * 1000, // 10 minutes
	10, // 10 deletes per window
	'Too many delete attempts. Please try again in 10 minutes.',
	false
);

// Bulk operations rate limiter (very strict)
export const bulkUpdateLimiter = createRateLimiter(
	30 * 60 * 1000, // 30 minutes
	5, // 5 bulk operations per window
	'Too many bulk operations. Please try again in 30 minutes.',
	false
);

// Helmet security configuration
export const helmetConfig = helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			scriptSrc: ["'self'"],
			imgSrc: ["'self'", "data:", "https:"],
			connectSrc: ["'self'"],
			fontSrc: ["'self'"],
			objectSrc: ["'none'"],
			mediaSrc: ["'self'"],
			frameSrc: ["'none'"],
		},
	},
	crossOriginEmbedderPolicy: false, // Disable for API compatibility
	hsts: {
		maxAge: 31536000,
		includeSubDomains: true,
		preload: true
	},
	noSniff: true,
	xssFilter: true,
	referrerPolicy: { policy: "same-origin" }
});

// ===== ADDITIONAL SECURITY MIDDLEWARE =====

/**
 * Security headers for API responses
 */
export const apiSecurityHeaders = (req, res, next) => {
    // Prevent caching of sensitive data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
};

/**
 * Validate Content-Type for POST/PUT/PATCH requests
 */
export const validateContentType = (req, res, next) => {
    const methodsRequiringBody = ['POST', 'PUT', 'PATCH'];
    
    if (methodsRequiringBody.includes(req.method)) {
        const contentType = req.headers['content-type'];
        
        // Skip validation for multipart/form-data (file uploads)
        if (contentType?.includes('multipart/form-data')) {
            return next();
        }
        
        // Skip for BillDesk webhook which may use different content types
        if (req.path.includes('/webhook') || req.path.includes('/response')) {
            return next();
        }
        
        // Require JSON content type for API endpoints
        if (req.body && Object.keys(req.body).length > 0) {
            if (!contentType?.includes('application/json') && 
                !contentType?.includes('application/x-www-form-urlencoded')) {
                return res.status(415).json({
                    error: 'Unsupported Media Type',
                    message: 'Content-Type must be application/json or application/x-www-form-urlencoded'
                });
            }
        }
    }
    
    next();
};

/**
 * Detect and block common attack patterns
 */
export const attackPatternDetection = (req, res, next) => {
    const suspiciousPatterns = [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // SQL injection
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
        /(\$where|\$gt|\$lt|\$ne|\$regex)/i, // NoSQL injection
        /(\.\.\/)|(\.\.\\)/g, // Path traversal
        /\b(union|select|insert|update|delete|drop|exec|execute)\b/i // SQL keywords
    ];
    
    const checkValue = (value, path = '') => {
        if (typeof value === 'string') {
            for (const pattern of suspiciousPatterns) {
                if (pattern.test(value)) {
                    console.warn(`Suspicious pattern detected in ${path}:`, {
                        ip: req.ip,
                        path: req.path,
                        pattern: pattern.toString()
                    });
                    return true;
                }
            }
        } else if (typeof value === 'object' && value !== null) {
            for (const [key, val] of Object.entries(value)) {
                if (checkValue(val, `${path}.${key}`)) {
                    return true;
                }
            }
        }
        return false;
    };
    
    // Check query params, body, and params
    if (checkValue(req.query, 'query') || 
        checkValue(req.body, 'body') || 
        checkValue(req.params, 'params')) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid characters detected in request'
        });
    }
    
    next();
};

/**
 * Slow down repeated requests (progressive delay)
 */
export const slowDown = (windowMs = 15 * 60 * 1000, delayAfter = 50, delayMs = 500) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const key = req.ip || 'unknown';
        const now = Date.now();
        
        // Get or create request tracking
        let tracking = requests.get(key);
        if (!tracking || now - tracking.windowStart > windowMs) {
            tracking = { count: 0, windowStart: now };
        }
        
        tracking.count++;
        requests.set(key, tracking);
        
        // Apply delay after threshold
        if (tracking.count > delayAfter) {
            const delay = Math.min((tracking.count - delayAfter) * delayMs, 10000); // Max 10s delay
            setTimeout(next, delay);
        } else {
            next();
        }
        
        // Cleanup old entries periodically
        if (Math.random() < 0.01) { // 1% chance to cleanup
            const cutoff = now - windowMs;
            for (const [k, v] of requests.entries()) {
                if (v.windowStart < cutoff) {
                    requests.delete(k);
                }
            }
        }
    };
};

// Export all rate limiters
export const rateLimiters = {
	auth: authLimiter,
	api: apiLimiter,
	refresh: refreshLimiter,
	adminCreation: adminCreationLimiter,
	bruteForce: bruteForceProtection,
	upload: uploadLimiter,
	update: updateLimiter,
	delete: deleteLimiter,
	bulkUpdate: bulkUpdateLimiter
};

export default {
	rateLimiters,
	helmetConfig,
	createRateLimiter,
    requestIdMiddleware,
    apiSecurityHeaders,
    validateContentType,
    attackPatternDetection,
    slowDown
};
