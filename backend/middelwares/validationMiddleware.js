import Joi from 'joi';

// Admin login validation schema
const loginSchema = Joi.object({
	email: Joi.string()
		.email()
		.required()
		.max(255)
		.lowercase()
		.trim()
		.messages({
			'string.email': 'Please provide a valid email address',
			'string.empty': 'Email is required',
			'any.required': 'Email is required'
		}),
	password: Joi.string()
		.min(6)
		.max(128)
		.required()
		.messages({
			'string.min': 'Password must be at least 6 characters long',
			'string.max': 'Password cannot exceed 128 characters',
			'string.empty': 'Password is required',
			'any.required': 'Password is required'
		}),
	platform: Joi.string()
		.valid('web', 'mobile')
		.default('web')
		.messages({
			'any.only': 'Platform must be either "web" or "mobile"'
		})
});

// Admin creation validation schema
const createAdminSchema = Joi.object({
	name: Joi.string()
		.min(2)
		.max(100)
		.required()
		.trim()
		.pattern(/^[a-zA-Z\s]+$/)
		.messages({
			'string.min': 'Name must be at least 2 characters long',
			'string.max': 'Name cannot exceed 100 characters',
			'string.pattern.base': 'Name can only contain letters and spaces',
			'string.empty': 'Name is required',
			'any.required': 'Name is required'
		}),
	email: Joi.string()
		.email()
		.required()
		.max(255)
		.lowercase()
		.trim()
		.messages({
			'string.email': 'Please provide a valid email address',
			'string.empty': 'Email is required',
			'any.required': 'Email is required'
		}),
	password: Joi.string()
		.min(8)
		.max(128)
		.required()
		.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
		.messages({
			'string.min': 'Password must be at least 8 characters long',
			'string.max': 'Password cannot exceed 128 characters',
			'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
			'string.empty': 'Password is required',
			'any.required': 'Password is required'
		}),
	role: Joi.string()
		.valid('Verve', 'Olympus', 'Aurum', 'Photographer', 'Admin', 'SuperAdmin')
		.required()
		.messages({
			'any.only': 'Role must be one of: Yuva, Olympus, Aurum, Photographer, Admin, SuperAdmin',
			'any.required': 'Role is required'
		})
});

// Event Coordinator creation validation schema
const createEventCoordinatorSchema = Joi.object({
	name: Joi.string()
		.min(2)
		.max(100)
		.required()
		.trim()
		.pattern(/^[a-zA-Z\s]+$/)
		.messages({
			'string.min': 'Name must be at least 2 characters long',
			'string.max': 'Name cannot exceed 100 characters',
			'string.pattern.base': 'Name can only contain letters and spaces',
			'string.empty': 'Name is required',
			'any.required': 'Name is required'
		}),
	email: Joi.string()
		.email()
		.required()
		.max(255)
		.lowercase()
		.trim()
		.messages({
			'string.email': 'Please provide a valid email address',
			'string.empty': 'Email is required',
			'any.required': 'Email is required'
		}),
	password: Joi.string()
		.min(8)
		.max(128)
		.required()
		.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
		.messages({
			'string.min': 'Password must be at least 8 characters long',
			'string.max': 'Password cannot exceed 128 characters',
			'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
			'string.empty': 'Password is required',
			'any.required': 'Password is required'
		}),
	eventCategory: Joi.string()
		.valid('Aurum', 'Yuva', 'Olympus', 'Verve')
		.required()
		.messages({
			'any.only': 'Event category must be one of: Aurum, Yuva, Olympus, Verve',
			'any.required': 'Event category is required'
		})
});

// Refresh token validation schema
// Note: refreshToken is optional here - the controller will check for token from cookie or body
// and return proper 401 if neither is present (not a validation error, but an auth error)
const refreshTokenSchema = Joi.object({
	refreshToken: Joi.string()
		.optional()
		.messages({
			'string.empty': 'Refresh token cannot be empty'
		}),
	platform: Joi.string()
		.valid('web', 'mobile')
		.default('web')
		.messages({
			'any.only': 'Platform must be either "web" or "mobile"'
		})
});

// Generic validation middleware
const validate = (schema, options = {}) => {
	return (req, res, next) => {
		// Determine if cookie exists for refresh token validation
		const context = {
			hasCookie: !!req.cookies?.refreshToken
		};

		const { error, value } = schema.validate(req.body, {
			abortEarly: false,
			stripUnknown: true,
			context,
			...options
		});

		if (error) {
			const errorMessages = error.details.map(detail => detail.message);
			return res.status(400).json({
				message: 'Validation error',
				errors: errorMessages,
				details: error.details
			});
		}

		// Replace req.body with validated and sanitized data
		req.body = value;
		next();
	};
};

// Specific validation middlewares
export const validateLogin = validate(loginSchema);
export const validateCreateAdmin = validate(createAdminSchema);
export const validateCreateEventCoordinator = validate(createEventCoordinatorSchema);
export const validateRefreshToken = validate(refreshTokenSchema);

// Generic sanitization middleware for query parameters
export const sanitizeQuery = (req, res, next) => {
	if (req.query) {
		Object.keys(req.query).forEach(key => {
			if (typeof req.query[key] === 'string') {
				// Basic XSS prevention
				req.query[key] = req.query[key]
					.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
					.replace(/javascript:/gi, '')
					.replace(/on\w+\s*=/gi, '')
					.trim();
			}
		});
	}
	next();
};

// Request size validation middleware
export const validateRequestSize = (req, res, next) => {
	const contentLength = req.get('content-length');
	if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
		return res.status(413).json({
			message: 'Request entity too large',
			maxSize: '10MB'
		});
	}
	next();
};

export default {
	validateLogin,
	validateCreateAdmin,
	validateCreateEventCoordinator,
	validateRefreshToken,
	sanitizeQuery,
	validateRequestSize
};
