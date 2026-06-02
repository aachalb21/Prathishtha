import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * MongoDB Connection Configuration
 * Production-ready with connection pooling, retry logic, and event handling
 */

// Connection options optimized for production
const connectionOptions = {
    dbName: process.env.MONGO_DATABASE,
    // Connection pool settings
    maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE) || 10,
    minPoolSize: 2,
    // Keep alive
    heartbeatFrequencyMS: 10000,
    // Retry settings
    retryWrites: true,
    retryReads: true,
    // Write concern for data safety
    w: 'majority',
    // Read preference
    readPreference: 'primaryPreferred',
    // Auto index in development only
    autoIndex: process.env.NODE_ENV !== 'production',
    // Compression for production
    compressors: process.env.NODE_ENV === 'production' ? ['zlib'] : undefined
};

// Connection state tracking
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 5000;

/**
 * Connect to MongoDB with retry logic
 */
const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI environment variable is not set');
        process.exit(1);
    }

    try {
        // Mask connection string for logging
        const maskedUri = process.env.MONGO_URI.replace(
            /\/\/([^:]+):([^@]+)@/,
            '//***:***@'
        );
        console.log(`🔄 Connecting to MongoDB: ${maskedUri}`);

        const conn = await mongoose.connect(process.env.MONGO_URI, connectionOptions);
        
        isConnected = true;
        reconnectAttempts = 0;
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`   Database: ${conn.connection.name}`);
        console.log(`   Pool Size: ${connectionOptions.maxPoolSize}`);

        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`🔄 Retrying connection (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${RECONNECT_INTERVAL/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, RECONNECT_INTERVAL));
            return connectDB();
        } else {
            console.error('❌ Max reconnection attempts reached. Exiting...');
            process.exit(1);
        }
    }
};

// ===== MONGOOSE EVENT HANDLERS =====

mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('📊 MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('⚠️  MongoDB disconnected');
    
    // Attempt to reconnect if not shutting down
    if (process.env.NODE_ENV === 'production' && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`🔄 Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(() => {
            mongoose.connect(process.env.MONGO_URI, connectionOptions).catch(() => {});
        }, RECONNECT_INTERVAL);
    }
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
    
    // Log specific error types
    if (err.name === 'MongoNetworkError') {
        console.error('   Network error - check connectivity');
    } else if (err.name === 'MongoServerSelectionError') {
        console.error('   Server selection error - check cluster status');
    }
});

mongoose.connection.on('reconnected', () => {
    isConnected = true;
    reconnectAttempts = 0;
    console.log('✅ MongoDB reconnected successfully');
});

// Monitor slow queries in development
if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', (collectionName, method, query, doc) => {
        console.log(`📝 MongoDB: ${collectionName}.${method}`, JSON.stringify(query).substring(0, 100));
    });
}

// ===== GRACEFUL SHUTDOWN =====

/**
 * Close database connection gracefully
 */
export const closeConnection = async () => {
    try {
        await mongoose.connection.close();
        isConnected = false;
        console.log('✅ MongoDB connection closed gracefully');
    } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error.message);
    }
};

/**
 * Check if database is connected
 */
export const isDbConnected = () => isConnected;

/**
 * Get connection statistics
 */
export const getConnectionStats = () => {
    const { connection } = mongoose;
    return {
        readyState: connection.readyState,
        readyStateString: ['disconnected', 'connected', 'connecting', 'disconnecting'][connection.readyState],
        host: connection.host,
        port: connection.port,
        name: connection.name,
        isConnected
    };
};

// Handle process termination
process.on('SIGINT', async () => {
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeConnection();
    process.exit(0);
});

export default connectDB;

