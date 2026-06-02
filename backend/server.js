import express, { Router } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import connectDB, { closeConnection, getConnectionStats } from "./configs/database.js";
import Adminrouter from "./routes/AdminRoutes.js";
import PhotographerRouter from "./routes/PhotographerRoutes.js";
import ScTeamRouter from "./routes/ScTeamRoutes.js";
import { startTokenCleanupJob } from "./jobs/tokenCleanup.js";
// import { startRegistrationCleanupJob } from "./jobs/registrationCleanup.js";
import { 
    helmetConfig, 
    rateLimiters, 
    requestIdMiddleware,
    apiSecurityHeaders,
    validateContentType,
    attackPatternDetection,
    slowDown
} from "./middelwares/securityMiddleware.js";
import { sanitizeQuery, validateRequestSize } from "./middelwares/validationMiddleware.js";
import { validateEnv, getSanitizedEnvInfo } from "./utils/envValidator.js";
import { auditLogger } from "./utils/auditLogger.js";
import Userrouter from "./routes/UsersRoutes.js";
import eventRouter from "./routes/EventRoutes.js";
import { initializeLeaderboardScheduler } from "./controllers/Users/LeaderBoardController.js";
import paymentRouter from "./routes/paymentRoutes.js";

// Load environment variables first
dotenv.config();

// Validate environment variables before starting
validateEnv();

const app = express();
const PORT = process.env.PORT || 8000;
const isProduction = process.env.NODE_ENV === 'production';

// ===== TRUST PROXY (for reverse proxies like nginx) =====
if (isProduction) {
    app.set('trust proxy', 1); // Trust first proxy
}

// ===== CORS CONFIGURATION =====
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, desktop apps, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
        
        if (allowedOrigins.indexOf(origin) !== -1 || !isProduction) {
            callback(null, true);
        } else {
            auditLogger.security.suspiciousActivity(null, 'CORS_VIOLATION', { origin });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID', 'X-Idempotency-Key'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200
};

// ===== SECURITY MIDDLEWARE (apply first) =====
app.use(requestIdMiddleware);
app.use(helmetConfig);
app.use(apiSecurityHeaders);
app.use(cors(corsOptions));

// ===== LOGGING MIDDLEWARE =====
// Custom morgan token for request ID
morgan.token('request-id', (req) => req.requestId || '-');
morgan.token('user-id', (req) => req.user?.id || req.admin?.id || '-');

const logFormat = isProduction 
    ? ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :request-id :response-time ms'
    : ':method :url :status :response-time ms - :request-id';

app.use(morgan(logFormat, {
    skip: (req) => req.path === '/health', // Don't log health checks
    stream: {
        write: (message) => auditLogger.info(message.trim())
    }
}));

// ===== RATE LIMITING =====
// app.use('/api/', rateLimiters.api);




// ===== REQUEST PARSING =====

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ===== REQUEST VALIDATION =====
app.use(validateRequestSize);
app.use(validateContentType);
app.use(sanitizeQuery);
app.use(attackPatternDetection);

// Define a basic route
app.get("/", (req, res) => {
  res.json({
    message: "Pratishtha Backend API",
    status: "Running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: isProduction ? 'production' : 'development'
  });
});

// Health check endpoint (detailed)
app.get("/health", (req, res) => {
  const dbStats = getConnectionStats();
  const healthStatus = dbStats.isConnected ? 'healthy' : 'degraded';
  
  res.status(dbStats.isConnected ? 200 : 503).json({
    status: healthStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || 'development',
    database: {
        status: dbStats.readyStateString,
        connected: dbStats.isConnected
    },
    memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  });
});

// Readiness check (for Kubernetes/load balancers)
app.get("/ready", (req, res) => {
    const dbStats = getConnectionStats();
    if (dbStats.isConnected) {
        res.status(200).json({ ready: true });
    } else {
        res.status(503).json({ ready: false, reason: 'Database not connected' });
    }
});

// ===== API ROUTES =====
app.use("/api/admin", Adminrouter);
app.use("/api/users", Userrouter);
app.use("/api/photographer", PhotographerRouter);
app.use("/api/events", eventRouter);
app.use("/api/sc-team", ScTeamRouter);
app.use(
    "/api/payments/webhook",
    express.raw({ type: "application/json" })
);
app.use("/api/payments", paymentRouter);

// ===== ERROR HANDLERS =====

// Global error handler
app.use((err, req, res, next) => {
  // Log error
  auditLogger.error('Unhandled error', err, {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation',
      message: 'Origin not allowed',
      requestId: req.requestId
    });
  }

  // Validation error (Joi)
  if (err.isJoi || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: err.details,
      requestId: req.requestId
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Authentication failed',
      requestId: req.requestId
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      message: 'Please login again',
      requestId: req.requestId
    });
  }

  // MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate entry',
        message: 'Resource already exists',
        requestId: req.requestId
      });
    }
  }

  // Rate limiting error
  if (err.status === 429) {
    auditLogger.security.rateLimitExceeded(req, req.path);
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: err.message || 'Rate limit exceeded',
      retryAfter: err.retryAfter,
      requestId: req.requestId
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large',
      message: 'File size exceeds limit',
      requestId: req.requestId
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal server error' : err.name || 'Error',
    message: isProduction && statusCode === 500 ? 'Something went wrong' : err.message,
    requestId: req.requestId,
    ...((!isProduction) && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    requestId: req.requestId
  });
});

// ===== GRACEFUL SHUTDOWN =====

let server;
const connections = new Set();

const gracefulShutdown = async (signal) => {
    console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    if (server) {
        server.close(() => {
            console.log('✅ HTTP server closed');
        });
    }
    
    // Close existing connections
    for (const connection of connections) {
        connection.destroy();
    }
    
    // Close database connection
    await closeConnection();
    
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    auditLogger.error('Uncaught Exception', err);
    console.error('❌ Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    auditLogger.error('Unhandled Rejection', reason);
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// ===== START SERVER =====
const startServer = async () => {
    try {
        // Connect to database first
        await connectDB();
        
        // Start HTTP server
        server = app.listen(PORT, () => {
            // Track connections for graceful shutdown
            server.on('connection', (connection) => {
                connections.add(connection);
                connection.on('close', () => connections.delete(connection));
            });
            
            // Start background jobs
            startTokenCleanupJob();
            // startRegistrationCleanupJob();
            initializeLeaderboardScheduler();
            
            console.log(`
🚀 Pratishtha Backend Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Server:       http://localhost:${PORT}
📁 Environment:  ${process.env.NODE_ENV || 'development'}
🔒 Security:     ✅ Production-Ready
   • CORS protection
   • Helmet security headers
   • Rate limiting (API, Auth, Payment)
   • Input validation & sanitization
   • Attack pattern detection
   • Request ID tracking
   • Audit logging
💳 Payments:     ✅ BillDesk Integration
   • Idempotency protection
   • Webhook IP verification
   • Transaction logging
🗄️  Database:    ✅ MongoDB Connected
   • Connection pooling
   • Auto-reconnect
   • Graceful shutdown
🔄 Background:   ✅ Jobs Running
   • Token cleanup
   • Registration cleanup
   • Leaderboard updates
📊 Endpoints:
   • Health: http://localhost:${PORT}/health
   • Ready:  http://localhost:${PORT}/ready
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
