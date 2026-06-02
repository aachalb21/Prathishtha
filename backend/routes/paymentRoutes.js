import express from "express";
import { checkAuth } from "../controllers/Users/auth.js";
import { verifyAccessToken, requireRole } from "../middelwares/Admin/authMiddleware.js";
import { rateLimiters, createRateLimiter } from "../middelwares/securityMiddleware.js";
import {
    paymentValidation,
    idempotencyMiddleware,
    validateWebhookTimestamp,
    sanitizePaymentData
} from "../middelwares/paymentValidation.js";
import {
    createPaymentOrder,
    getOrderStatus,
    getPaymentHistory,
    retryPayment,
    getAllTransactions,
    getTransactionDetails,
    getTransactionSummary,
    forwardToBillDesk,
    createPaymentOrderZaikaa
} from "../controllers/Payment/CreateOrder.js";
import {
    handlePaymentResponse,
    handleWebhook,
    verifyPaymentStatus,
    handlePaymentResponseZaikaa,
    handleWebhookZaikaa
} from "../controllers/Payment/Webhook.js";

const paymentRouter = express.Router();

// ===== RATE LIMITERS FOR PAYMENT ROUTES =====

// Strict rate limiter for payment creation (prevent abuse)
const paymentCreationLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    10, // 10 payment attempts per window
    'Too many payment attempts. Please try again in 15 minutes.',
    false
);

// Moderate rate limiter for payment status checks
const paymentStatusLimiter = createRateLimiter(
    5 * 60 * 1000, // 5 minutes
    30, // 30 status checks per window
    'Too many status check requests. Please try again in 5 minutes.',
    true
);

// Very strict rate limiter for payment retries
const paymentRetryLimiter = createRateLimiter(
    30 * 60 * 1000, // 30 minutes
    5, // 5 retry attempts per window
    'Too many retry attempts. Please try again in 30 minutes.',
    false
);

// ===== MIDDLEWARE FOR ALL PAYMENT ROUTES =====

// Apply sanitization to all payment routes
paymentRouter.use(sanitizePaymentData);

// ===== AUTHENTICATED USER ROUTES =====

// Create payment order (initiate payment)
paymentRouter.post(
    "/create-order",
    // paymentCreationLimiter,
    checkAuth,
    paymentValidation.validateCreateOrder,
    idempotencyMiddleware((req) => `create_order_${req.body.orderId}`),
    createPaymentOrder
);

// Get order status
paymentRouter.get(
    "/order/:orderId",
    paymentStatusLimiter,
    checkAuth,
    paymentValidation.validateOrderIdParam,
    getOrderStatus
);

// Get payment history
paymentRouter.get(
    "/history",
    paymentStatusLimiter,
    checkAuth,
    getPaymentHistory
);

// Retry failed payment
paymentRouter.post(
    "/retry",
    paymentRetryLimiter,
    checkAuth,
    paymentValidation.validateRetryPayment,
    idempotencyMiddleware((req) => `retry_${req.body.orderId}`),
    retryPayment
);

// ===== PUBLIC ROUTES (for BillDesk callbacks) =====

// Payment response handler (Return URL - redirect from BillDesk)
paymentRouter.post(
    "/response",
    express.text({ type: ['application/jose', 'text/plain'] }),
    express.urlencoded({
        extended: true,
        verify: (req, res, buf) => {
            req.rawBody = buf.toString('utf8');
        }
    }),
    validateWebhookTimestamp(600), // 10 minute tolerance for redirects
    handlePaymentResponse
);

// Webhook handler (Server-to-Server callback from BillDesk)
paymentRouter.post(
    "/webhook",
    (req, res, next) => {
        console.log('🎯 Webhook route hit');
        console.log('Content-Type:', req.headers['content-type']);
        next();
    },
    // express.json(),
    validateWebhookTimestamp(300), // 5 minute tolerance for webhooks
    paymentValidation.validateWebhook,
    handleWebhook
);

// Lightweight redirect helper to ensure POST with transaction_request
paymentRouter.get(
    "/forward",
    forwardToBillDesk
);

// ===== ADMIN ROUTES =====

// Get all transactions (admin only)
paymentRouter.get(
    "/transactions",
    rateLimiters.api,
    verifyAccessToken,
    requireRole(["SuperAdmin", "Admin"]),
    paymentValidation.validateTransactionsQuery,
    getAllTransactions
);

// Get transaction summary/stats (admin only)
paymentRouter.get(
    "/transactions/summary",
    rateLimiters.api,
    verifyAccessToken,
    requireRole(["SuperAdmin", "Admin"]),
    getTransactionSummary
);

// Get transaction details (admin only)
paymentRouter.get(
    "/transaction/:transactionId",
    rateLimiters.api,
    verifyAccessToken,
    requireRole(["SuperAdmin", "Admin"]),
    paymentValidation.validateTransactionIdParam,
    getTransactionDetails
);

// Verify payment status (manual verification - admin only)
paymentRouter.post(
    "/verify",
    rateLimiters.api,
    verifyAccessToken,
    requireRole(["SuperAdmin", "Admin"]),
    paymentValidation.validateVerifyPayment,
    verifyPaymentStatus
);




paymentRouter.post(
    "/create-order-zaikaa",
    // Removed idempotencyMiddleware - ZaikaaOrder model handles duplicate checks
    // and allows re-attempts for non-PAID orders
    createPaymentOrderZaikaa,
    
)

// ===== ZAIKAA PAYMENT ROUTES =====

// Payment response handler for Zaikaa (Return URL - redirect from BillDesk)
paymentRouter.post(
    "/response-zaikaa",
    express.text({ type: ['application/jose', 'text/plain'] }),
    express.urlencoded({
        extended: true,
        verify: (req, res, buf) => {
            req.rawBody = buf.toString('utf8');
        }
    }),
    validateWebhookTimestamp(600),
    handlePaymentResponseZaikaa
);

// Webhook handler for Zaikaa (Server-to-Server callback from BillDesk)
paymentRouter.post(
    "/webhook-zaikaa",
    // express.json(),
    validateWebhookTimestamp(300),
    paymentValidation.validateWebhook,
    handleWebhookZaikaa
);

export default paymentRouter;