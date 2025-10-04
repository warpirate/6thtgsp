const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { config, pool } = require('./config/database');
const { authenticateToken } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const itemRoutes = require('./routes/items');
const receiptRoutes = require('./routes/receipts');
const reportRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || false
    : true,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: config.rateLimit.message,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path !== '/api/auth/login' // Only apply to login route
});
app.use('/api/auth/login', loginLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Create uploads directory if it doesn't exist
const uploadsDir = config.upload.dir;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadsDir}`);
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/items', authenticateToken, itemRoutes);
app.use('/api/receipts', authenticateToken, receiptRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/audit-logs', authenticateToken, auditRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Quarter Master Inventory Management System API',
    version: '1.0.0',
    description: 'API for military/police quarter master inventory management',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        'change-password': 'POST /api/auth/change-password'
      },
      users: {
        list: 'GET /api/users',
        create: 'POST /api/users',
        get: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
        deactivate: 'POST /api/users/:id/deactivate',
        activate: 'POST /api/users/:id/activate',
        'reset-password': 'POST /api/users/:id/reset-password'
      },
      items: {
        list: 'GET /api/items',
        create: 'POST /api/items',
        get: 'GET /api/items/:id',
        update: 'PUT /api/items/:id',
        search: 'GET /api/items/search',
        stats: 'GET /api/items/stats'
      },
      receipts: {
        list: 'GET /api/receipts',
        create: 'POST /api/receipts',
        get: 'GET /api/receipts/:id',
        update: 'PUT /api/receipts/:id',
        submit: 'POST /api/receipts/:id/submit',
        verify: 'POST /api/receipts/:id/verify',
        approve: 'POST /api/receipts/:id/approve',
        'upload-document': 'POST /api/receipts/:id/documents',
        stats: 'GET /api/receipts/stats'
      },
      reports: {
        'receipt-register': 'GET /api/reports/receipt-register',
        'item-history': 'GET /api/reports/item-history/:itemId',
        'pending-approvals': 'GET /api/reports/pending-approvals',
        'user-activity': 'GET /api/reports/user-activity',
        'system-stats': 'GET /api/reports/system-stats',
        export: 'GET /api/reports/export/:report_type'
      },
      audit: {
        logs: 'GET /api/audit-logs',
        'receipt-trail': 'GET /api/audit-logs/receipt/:id'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  // Handle multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field.' });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }

  // Handle database errors
  if (error.code) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database operation failed' });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

// Start server
const server = app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${config.port}/api/health`);
  console.log(`📚 API docs: http://localhost:${config.port}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
