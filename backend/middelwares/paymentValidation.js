/**
 * Payment Validation Middleware
 * Input validation schemas and middleware for payment endpoints
 * Production-ready with comprehensive validation
 */

import Joi from 'joi';

// ===== VALIDATION SCHEMAS =====

/**
 * Create payment order validation schema
 */
const createOrderSchema = Joi.object({
    orderId: Joi.string()
        .pattern(/^ORD_[A-Z0-9_]+$/i)
        .required()
        .messages({
            'string.pattern.base': 'Invalid order ID format',
            'any.required': 'Order ID is required'
        })
});

/**
 * Retry payment validation schema
 */
const retryPaymentSchema = Joi.object({
    orderId: Joi.string()
        .pattern(/^ORD_[A-Z0-9_]+$/i)
        .required()
        .messages({
            'string.pattern.base': 'Invalid order ID format',
            'any.required': 'Order ID is required'
        })
});

/**
 * Verify payment validation schema
 */
const verifyPaymentSchema = Joi.object({
    orderId: Joi.string()
        .pattern(/^ORD_[A-Z0-9_]+$/i)
        .required()
        .messages({
            'string.pattern.base': 'Invalid order ID format',
            'any.required': 'Order ID is required'
        })
});

/**
 * Order ID param validation schema
 */
const orderIdParamSchema = Joi.object({
    orderId: Joi.string()
        .pattern(/^ORD_[A-Z0-9_]+$/i)
        .required()
        .messages({
            'string.pattern.base': 'Invalid order ID format'
        })
});

/**
 * Transaction ID param validation schema
 */
const transactionIdParamSchema = Joi.object({
    transactionId: Joi.string()
        .pattern(/^TXN_[A-Z0-9_]+$/i)
        .required()
        .messages({
            'string.pattern.base': 'Invalid transaction ID format'
        })
});

/**
 * Transactions query validation schema
 */
const transactionsQuerySchema = Joi.object({
    status: Joi.string()
        .valid('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUND_INITIATED', 'REFUNDED', 'CANCELLED')
        .optional(),
    startDate: Joi.date()
        .iso()
        .optional()
        .messages({
            'date.format': 'Start date must be in ISO format'
        }),
    endDate: Joi.date()
        .iso()
        .greater(Joi.ref('startDate'))
        .optional()
        .messages({
            'date.format': 'End date must be in ISO format',
            'date.greater': 'End date must be after start date'
        }),
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .optional(),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(50)
        .optional()
});

/**
 * BillDesk webhook payload validation
 */
const billDeskWebhookSchema = Joi.object({
    encrypted_response: Joi.string()
        .optional()
        .messages({
            'string.base': 'Encrypted response must be a string'
        }),
    transaction_response: Joi.string()
        .optional()
        .messages({
            'string.base': 'Transaction response must be a string'
        })
})
.or('encrypted_response', 'transaction_response')
.unknown(true); // Allow additional fields from BillDesk

// ===== VALIDATION MIDDLEWARE FACTORY =====

/**
 * Create validation middleware
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} source - Request property to validate ('body', 'params', 'query')
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const dataToValidate = req[source];

        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const errorMessages = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errorMessages
            });
        }

        // Replace with validated and sanitized data
        req[source] = value;
        next();
    };
};

// ===== EXPORT VALIDATION MIDDLEWARES =====

export const paymentValidation = {
    // Body validations
    validateCreateOrder: validate(createOrderSchema, 'body'),
    validateRetryPayment: validate(retryPaymentSchema, 'body'),
    validateVerifyPayment: validate(verifyPaymentSchema, 'body'),
    validateWebhook: validate(billDeskWebhookSchema, 'body'),

    // Param validations
    validateOrderIdParam: validate(orderIdParamSchema, 'params'),
    validateTransactionIdParam: validate(transactionIdParamSchema, 'params'),

    // Query validations
    validateTransactionsQuery: validate(transactionsQuerySchema, 'query')
};

// ===== IDEMPOTENCY MIDDLEWARE =====

// In-memory store for idempotency (use Redis in production for distributed systems)
const idempotencyStore = new Map();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Idempotency middleware for payment operations
 * Prevents duplicate payment processing
 */
export const idempotencyMiddleware = (keyExtractor) => {
    return async (req, res, next) => {
        const idempotencyKey = req.headers['x-idempotency-key'] || keyExtractor?.(req);

        if (!idempotencyKey) {
            return next(); // No idempotency key, proceed normally
        }

        const userId = req.user?.id;
        const fullKey = `${userId || 'anon'}_${idempotencyKey}`;

        // Check if we've seen this request before
        const cached = idempotencyStore.get(fullKey);

        if (cached) {
            // Check if still processing
            if (cached.status === 'processing') {
                return res.status(409).json({
                    success: false,
                    message: 'Request is already being processed',
                    code: 'DUPLICATE_REQUEST'
                });
            }

            // Return cached response
            if (cached.status === 'completed') {
                return res.status(cached.statusCode).json(cached.response);
            }
        }

        // Mark as processing
        idempotencyStore.set(fullKey, {
            status: 'processing',
            timestamp: Date.now()
        });

        // Override res.json to cache the response
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            idempotencyStore.set(fullKey, {
                status: 'completed',
                statusCode: res.statusCode,
                response: body,
                timestamp: Date.now()
            });
            return originalJson(body);
        };

        // Clean up on error
        res.on('finish', () => {
            // If there was an error, remove from processing
            if (res.statusCode >= 500) {
                idempotencyStore.delete(fullKey);
            }
        });

        next();
    };
};

// Cleanup old idempotency entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of idempotencyStore.entries()) {
        if (now - value.timestamp > IDEMPOTENCY_TTL) {
            idempotencyStore.delete(key);
        }
    }
}, 60 * 60 * 1000); // Every hour

// ===== ADDITIONAL SECURITY MIDDLEWARE =====

/**
 * Validate webhook signature timestamp
 * Prevents replay attacks
 */
export const validateWebhookTimestamp = (maxAgeSeconds = 300) => {
    return (req, res, next) => {
        const timestamp = req.headers['x-billdesk-timestamp'] || req.body?.timestamp;

        if (timestamp) {
            const requestTime = new Date(timestamp).getTime();
            const now = Date.now();
            const age = Math.abs(now - requestTime) / 1000;

            if (age > maxAgeSeconds) {
                console.warn('Webhook timestamp too old:', { timestamp, age });
                return res.status(400).json({
                    success: false,
                    message: 'Request timestamp expired',
                    code: 'TIMESTAMP_EXPIRED'
                });
            }
        }

        next();
    };
};

/**
 * Sanitize payment-related request data
 */
export const sanitizePaymentData = (req, res, next) => {
    if (req.body) {
        // Remove any HTML/script tags from string fields
        const sanitizeString = (str) => {
            if (typeof str !== 'string') return str;
            return str
                .replace(/<[^>]*>/g, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
        };

        const sanitizeObject = (obj) => {
            if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            }
            if (obj && typeof obj === 'object') {
                const sanitized = {};
                for (const [key, value] of Object.entries(obj)) {
                    sanitized[key] = sanitizeObject(value);
                }
                return sanitized;
            }
            return sanitizeString(obj);
        };

        req.body = sanitizeObject(req.body);
    }

    next();
};

export default {
    paymentValidation,
    idempotencyMiddleware,
    validateWebhookTimestamp,
    sanitizePaymentData
};
