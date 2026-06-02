/**
 * Environment Variable Validator
 * Validates all required environment variables on startup
 * Production-ready configuration validation
 */

const requiredEnvVars = {
    // ===== SERVER CONFIGURATION =====
    PORT: {
        required: false,
        default: '8000',
        description: 'Server port'
    },
    NODE_ENV: {
        required: false,
        default: 'development',
        validValues: ['development', 'production', 'staging', 'test'],
        description: 'Node environment'
    },

    // ===== DATABASE (MongoDB) =====
    MONGO_URI: {
        required: true,
        sensitive: true,
        description: 'MongoDB connection string'
    },
    MONGO_DATABASE: {
        required: true,
        sensitive: false,
        description: 'MongoDB database name'
    },
    MONGO_POOL_SIZE: {
        required: false,
        default: '10',
        description: 'MongoDB connection pool size'
    },

    // ===== JWT AUTHENTICATION =====
    ACCESS_TOKEN_SECRET: {
        required: true,
        sensitive: true,
        minLength: 32,
        description: 'JWT access token secret (min 32 characters)'
    },
    REFRESH_TOKEN_SECRET: {
        required: true,
        sensitive: true,
        minLength: 32,
        description: 'JWT refresh token secret (min 32 characters)'
    },

    // ===== CORS CONFIGURATION =====
    ALLOWED_ORIGINS: {
        required: true,
        description: 'Comma-separated list of allowed CORS origins'
    },

    // ===== APPLICATION URLs =====
    FRONTEND_URL: {
        required: true,
        description: 'Frontend application URL'
    },

    // ===== EMAIL CONFIGURATION =====
    EMAIL_ADDRESS: {
        required: true,
        description: 'Email service address (sender email)'
    },
    EMAIL_PASSWORD: {
        required: true,
        sensitive: true,
        description: 'Email service app password'
    },

    // ===== CLOUDINARY (File Storage) =====
    CLOUDINARY_CLOUD_NAME: {
        required: false,
        description: 'Cloudinary cloud name'
    },
    CLOUDINARY_API_KEY: {
        required: false,
        sensitive: true,
        description: 'Cloudinary API key'
    },
    CLOUDINARY_API_SECRET: {
        required: false,
        sensitive: true,
        description: 'Cloudinary API secret'
    },

    // ===== BILLDESK PAYMENT GATEWAY =====
    PAYMENT_ENABLED: {
        required: false,
        default: 'false',
        validValues: ['true', 'false'],
        description: 'Enable payment processing'
    },
    BILLDESK_MERCHANT_ID: {
        required: false,
        conditionalRequired: 'PAYMENT_ENABLED',
        description: 'BillDesk merchant ID'
    },
    BILLDESK_CLIENT_ID: {
        required: false,
        conditionalRequired: 'PAYMENT_ENABLED',
        description: 'BillDesk client ID'
    },
    BILLDESK_SECRET_KEY: {
        required: false,
        sensitive: true,
        conditionalRequired: 'PAYMENT_ENABLED',
        // UAT keys are 12 chars; keep a guard but match actual key length
        minLength: 12,
        description: 'BillDesk secret key (min 12 characters)'
    },
    BILLDESK_BASE_URL: {
        required: false,
        default: 'https://pguat.billdesk.io',
        description: 'BillDesk API base URL'
    },
    BILLDESK_ALLOWED_IPS: {
        required: false,
        description: 'Comma-separated list of BillDesk webhook IPs'
    },

    // ===== LOGGING =====
    LOG_DIR: {
        required: false,
        description: 'Directory for log files'
    },
    LOG_LEVEL: {
        required: false,
        default: 'info',
        validValues: ['error', 'warn', 'info', 'debug'],
        description: 'Logging level'
    },

    // ===== RATE LIMITING =====
    RATE_LIMIT_BYPASS: {
        required: false,
        default: 'false',
        validValues: ['true', 'false'],
        description: 'Bypass rate limiting (development only)'
    }
};

/**
 * Validate environment variables
 * @throws {Error} If required variables are missing or invalid
 */
export function validateEnv() {
    const errors = [];
    const warnings = [];
    const isProduction = process.env.NODE_ENV === 'production';

    console.log('\n🔐 Validating environment variables...\n');

    for (const [varName, config] of Object.entries(requiredEnvVars)) {
        const value = process.env[varName];

        // Check required variables
        if (config.required && !value) {
            errors.push(`❌ ${varName}: Required but not set - ${config.description}`);
            continue;
        }

        // Check conditionally required variables
        if (config.conditionalRequired && process.env[config.conditionalRequired] === 'true' && !value) {
            errors.push(`❌ ${varName}: Required when ${config.conditionalRequired} is enabled - ${config.description}`);
            continue;
        }

        // Set default values
        if (!value && config.default) {
            process.env[varName] = config.default;
            console.log(`   ℹ️  ${varName}: Using default value`);
            continue;
        }

        if (!value) {
            continue; // Optional and not set
        }

        // Validate minimum length
        if (config.minLength && value.length < config.minLength) {
            errors.push(`❌ ${varName}: Must be at least ${config.minLength} characters - ${config.description}`);
            continue;
        }

        // Validate allowed values
        if (config.validValues && !config.validValues.includes(value)) {
            errors.push(`❌ ${varName}: Must be one of [${config.validValues.join(', ')}], got: ${value}`);
            continue;
        }

        // Log validation success (without sensitive values)
        if (config.sensitive) {
            console.log(`   ✅ ${varName}: Set (${value.length} chars)`);
        } else {
            console.log(`   ✅ ${varName}: ${value}`);
        }
    }

    // Production-specific validations
    if (isProduction) {
        // Ensure HTTPS for URLs
        if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.startsWith('https://')) {
            warnings.push(`⚠️  FRONTEND_URL should use HTTPS in production`);
        }

        // Warn about weak secrets
        if (process.env.ACCESS_TOKEN_SECRET && process.env.ACCESS_TOKEN_SECRET.length < 64) {
            warnings.push(`⚠️  ACCESS_TOKEN_SECRET should be at least 64 characters in production`);
        }
        if (process.env.REFRESH_TOKEN_SECRET && process.env.REFRESH_TOKEN_SECRET.length < 64) {
            warnings.push(`⚠️  REFRESH_TOKEN_SECRET should be at least 64 characters in production`);
        }

        // Check BillDesk production URL
        if (process.env.BILLDESK_BASE_URL?.includes('uat')) {
            warnings.push(`⚠️  BILLDESK_BASE_URL appears to be UAT URL, change to production URL`);
        }

        // Warn if BillDesk IP whitelist not set
        if (process.env.PAYMENT_ENABLED === 'true' && !process.env.BILLDESK_ALLOWED_IPS) {
            warnings.push(`⚠️  BILLDESK_ALLOWED_IPS not set - webhook IP verification disabled`);
        }

        // Warn if rate limit bypass is enabled
        if (process.env.RATE_LIMIT_BYPASS === 'true') {
            warnings.push(`⚠️  RATE_LIMIT_BYPASS is enabled - disable in production!`);
        }
    }

    // Print warnings
    if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(w => console.log(`   ${w}`));
    }

    // Print errors and exit if any
    if (errors.length > 0) {
        console.error('\n❌ Environment validation failed:');
        errors.forEach(e => console.error(`   ${e}`));
        console.error('\n💡 Please check your .env file and ensure all required variables are set.\n');
        
        if (isProduction) {
            process.exit(1);
        } else {
            console.warn('⚠️  Continuing in development mode with missing variables...\n');
        }
    } else {
        console.log('\n✅ Environment validation passed!\n');
    }

    return { errors, warnings };
}

/**
 * Get sanitized environment info (for logging/debugging)
 * Hides sensitive values
 */
export function getSanitizedEnvInfo() {
    const info = {};
    
    for (const [varName, config] of Object.entries(requiredEnvVars)) {
        const value = process.env[varName];
        if (!value) {
            info[varName] = '(not set)';
        } else if (config.sensitive) {
            info[varName] = `****${value.slice(-4)}`;
        } else {
            info[varName] = value;
        }
    }
    
    return info;
}

export default { validateEnv, getSanitizedEnvInfo };
