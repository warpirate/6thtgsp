const { Pool } = require('pg');
require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Database configuration
  database: process.env.DATABASE_URL 
    ? {
        // Supabase connection string (takes precedence if set)
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false // Required for Supabase
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        acquireTimeoutMillis: 10000,
      }
    : {
        // Traditional PostgreSQL connection
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'quartermaster_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },

  // File upload configuration
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
  },

  // Session configuration
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT) || 30 * 60 * 1000, // 30 minutes
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
  }
};

// Create database pool
const pool = new Pool(config.database);

// Test database connection
pool.on('connect', (client) => {
  if (config.nodeEnv === 'development') {
    const dbType = process.env.DATABASE_URL ? 'Supabase' : 'PostgreSQL';
    console.log(`✅ New client connected to ${dbType}`);
  }
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  config,
  pool
};
