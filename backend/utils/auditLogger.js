/**
 * Audit Logger Utility
 * Logs important security and payment events for compliance and debugging
 * Production-ready logging with Winston
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const logLevels = {
    levels: {
        error: 0,
        warn: 1,
        security: 2,
        payment: 3,
        audit: 4,
        info: 5,
        debug: 6
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        security: 'magenta',
        payment: 'cyan',
        audit: 'blue',
        info: 'green',
        debug: 'white'
    }
};

winston.addColors(logLevels.colors);

// Custom format for structured logging
const structuredFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
});

// Create base logger
const createLogger = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const logDir = process.env.LOG_DIR || path.join(__dirname, '../logs');

    const transports = [
        // Console transport (always enabled)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                structuredFormat
            )
        })
    ];

    // File transports for production
    if (isProduction) {
        // General application log
        transports.push(
            new winston.transports.File({
                filename: path.join(logDir, 'error.log'),
                level: 'error',
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 10
            })
        );

        // Security events log
        transports.push(
            new winston.transports.File({
                filename: path.join(logDir, 'security.log'),
                level: 'security',
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                maxsize: 10 * 1024 * 1024,
                maxFiles: 30 // Keep 30 days
            })
        );

        // Payment events log
        transports.push(
            new winston.transports.File({
                filename: path.join(logDir, 'payment.log'),
                level: 'payment',
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                maxsize: 10 * 1024 * 1024,
                maxFiles: 90 // Keep 90 days for compliance
            })
        );

        // Audit log (all important events)
        transports.push(
            new winston.transports.File({
                filename: path.join(logDir, 'audit.log'),
                level: 'audit',
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                maxsize: 10 * 1024 * 1024,
                maxFiles: 90
            })
        );

        // Combined log
        transports.push(
            new winston.transports.File({
                filename: path.join(logDir, 'combined.log'),
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                maxsize: 10 * 1024 * 1024,
                maxFiles: 10
            })
        );
    }

    return winston.createLogger({
        levels: logLevels.levels,
        level: isProduction ? 'audit' : 'debug',
        transports,
        exitOnError: false
    });
};

const logger = createLogger();

/**
 * Sanitize sensitive data for logging
 */
const sanitize = (data) => {
    if (!data) return data;
    
    const sensitiveFields = [
        'password', 'token', 'secret', 'key', 'authorization',
        'cookie', 'refreshToken', 'accessToken', 'cardNumber',
        'cvv', 'pin', 'otp', 'secretKey'
    ];

    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '***REDACTED***';
        }
    }

    // Handle nested objects
    for (const key of Object.keys(sanitized)) {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            sanitized[key] = sanitize(sanitized[key]);
        }
    }

    return sanitized;
};

/**
 * Extract request metadata for logging
 */
const getRequestMeta = (req) => {
    if (!req) return {};
    
    return {
        ip: req.ip || req.connection?.remoteAddress || req.headers?.['x-forwarded-for']?.split(',')[0],
        userAgent: req.headers?.['user-agent'],
        method: req.method,
        path: req.path || req.url,
        userId: req.user?.id || req.admin?.id,
        sessionId: req.sessionId,
        requestId: req.requestId || req.headers?.['x-request-id']
    };
};

/**
 * Audit Logger API
 */
export const auditLogger = {
    // Security events
    security: {
        loginAttempt: (req, success, userId = null, reason = null) => {
            logger.log('security', 'Login attempt', {
                event: 'LOGIN_ATTEMPT',
                success,
                userId,
                reason,
                ...getRequestMeta(req)
            });
        },

        loginSuccess: (req, userId, userType = 'user') => {
            logger.log('security', 'Login successful', {
                event: 'LOGIN_SUCCESS',
                userId,
                userType,
                ...getRequestMeta(req)
            });
        },

        loginFailure: (req, reason, email = null) => {
            logger.log('security', 'Login failed', {
                event: 'LOGIN_FAILURE',
                reason,
                attemptedEmail: email ? `${email.slice(0, 3)}***` : null,
                ...getRequestMeta(req)
            });
        },

        logout: (req, userId) => {
            logger.log('security', 'User logout', {
                event: 'LOGOUT',
                userId,
                ...getRequestMeta(req)
            });
        },

        tokenRefresh: (req, userId, success) => {
            logger.log('security', 'Token refresh', {
                event: 'TOKEN_REFRESH',
                userId,
                success,
                ...getRequestMeta(req)
            });
        },

        unauthorizedAccess: (req, resource, reason) => {
            logger.log('security', 'Unauthorized access attempt', {
                event: 'UNAUTHORIZED_ACCESS',
                resource,
                reason,
                ...getRequestMeta(req)
            });
        },

        suspiciousActivity: (req, activity, details) => {
            logger.log('security', 'Suspicious activity detected', {
                event: 'SUSPICIOUS_ACTIVITY',
                activity,
                details: sanitize(details),
                ...getRequestMeta(req)
            });
        },

        rateLimitExceeded: (req, endpoint) => {
            logger.log('security', 'Rate limit exceeded', {
                event: 'RATE_LIMIT_EXCEEDED',
                endpoint,
                ...getRequestMeta(req)
            });
        },

        invalidSignature: (req, source) => {
            logger.log('security', 'Invalid signature detected', {
                event: 'INVALID_SIGNATURE',
                source,
                ...getRequestMeta(req)
            });
        }
    },

    // Payment events
    payment: {
        orderCreated: (req, orderId, amount, eventId, userId) => {
            logger.log('payment', 'Payment order created', {
                event: 'ORDER_CREATED',
                orderId,
                amount,
                eventId,
                userId,
                ...getRequestMeta(req)
            });
        },

        paymentInitiated: (req, orderId, transactionId, amount) => {
            logger.log('payment', 'Payment initiated', {
                event: 'PAYMENT_INITIATED',
                orderId,
                transactionId,
                amount,
                ...getRequestMeta(req)
            });
        },

        paymentSuccess: (req, orderId, transactionId, amount, bdTransactionId) => {
            logger.log('payment', 'Payment successful', {
                event: 'PAYMENT_SUCCESS',
                orderId,
                transactionId,
                bdTransactionId,
                amount,
                ...getRequestMeta(req)
            });
        },

        paymentFailure: (req, orderId, transactionId, reason, errorCode) => {
            logger.log('payment', 'Payment failed', {
                event: 'PAYMENT_FAILURE',
                orderId,
                transactionId,
                reason,
                errorCode,
                ...getRequestMeta(req)
            });
        },

        webhookReceived: (req, source, orderId) => {
            logger.log('payment', 'Webhook received', {
                event: 'WEBHOOK_RECEIVED',
                source,
                orderId,
                ...getRequestMeta(req)
            });
        },

        webhookProcessed: (req, orderId, status) => {
            logger.log('payment', 'Webhook processed', {
                event: 'WEBHOOK_PROCESSED',
                orderId,
                status,
                ...getRequestMeta(req)
            });
        },

        refundInitiated: (req, orderId, transactionId, amount, reason) => {
            logger.log('payment', 'Refund initiated', {
                event: 'REFUND_INITIATED',
                orderId,
                transactionId,
                amount,
                reason,
                ...getRequestMeta(req)
            });
        }
    },

    // Audit events
    audit: {
        adminAction: (req, action, targetType, targetId, details = {}) => {
            logger.log('audit', 'Admin action', {
                event: 'ADMIN_ACTION',
                action,
                targetType,
                targetId,
                details: sanitize(details),
                ...getRequestMeta(req)
            });
        },

        dataAccess: (req, resource, action, recordCount = null) => {
            logger.log('audit', 'Data access', {
                event: 'DATA_ACCESS',
                resource,
                action,
                recordCount,
                ...getRequestMeta(req)
            });
        },

        configChange: (req, setting, oldValue, newValue) => {
            logger.log('audit', 'Configuration change', {
                event: 'CONFIG_CHANGE',
                setting,
                oldValue: sanitize({ value: oldValue }).value,
                newValue: sanitize({ value: newValue }).value,
                ...getRequestMeta(req)
            });
        },

        userRegistration: (req, userId, email) => {
            logger.log('audit', 'User registration', {
                event: 'USER_REGISTRATION',
                userId,
                email: `${email.slice(0, 3)}***@***`,
                ...getRequestMeta(req)
            });
        },

        eventRegistration: (req, userId, eventId, teamId = null) => {
            logger.log('audit', 'Event registration', {
                event: 'EVENT_REGISTRATION',
                userId,
                eventId,
                teamId,
                ...getRequestMeta(req)
            });
        }
    },

    // General logging
    error: (message, error, meta = {}) => {
        logger.error(message, {
            error: error?.message,
            stack: error?.stack,
            ...sanitize(meta)
        });
    },

    warn: (message, meta = {}) => {
        logger.warn(message, sanitize(meta));
    },

    info: (message, meta = {}) => {
        logger.info(message, sanitize(meta));
    },

    debug: (message, meta = {}) => {
        logger.debug(message, sanitize(meta));
    }
};

export default auditLogger;
