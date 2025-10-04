const jwt = require('jsonwebtoken');
const { config, pool } = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from database
    const result = await pool.query(
      'SELECT id, username, full_name, rank, service_number, role, email, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'User account is disabled' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware for role-based access control
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Convenience middleware for specific roles
const requireUser = authorizeRoles('user', 'admin', 'super_admin');
const requireAdmin = authorizeRoles('admin', 'super_admin');
const requireSuperAdmin = authorizeRoles('super_admin');

// Middleware to check if user owns the resource or is admin+
const requireOwnershipOrAdmin = (resourceUserIdField = 'received_by') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Super admins and admins can access any resource
    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      return next();
    }

    // For regular users, check ownership
    if (req.user.role === 'user') {
      const result = await pool.query(
        `SELECT ${resourceUserIdField} FROM stock_receipts WHERE id = $1`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      if (result.rows[0][resourceUserIdField] !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    next();
  };
};

// Middleware to log user activity
const logActivity = (action, tableName = null, recordId = null) => {
  return async (req, res, next) => {
    // Store original send method
    const originalSend = res.send;

    res.send = function(data) {
      // Log activity after response is sent
      res.on('finish', async () => {
        try {
          if (req.user) {
            await pool.query(`
              INSERT INTO audit_logs (user_id, action, table_name, record_id, ip_address, user_agent)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              req.user.id,
              action,
              tableName,
              recordId,
              req.ip || req.connection.remoteAddress,
              req.get('User-Agent')
            ]);
          }
        } catch (error) {
          console.error('Failed to log activity:', error);
        }
      });

      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireUser,
  requireAdmin,
  requireSuperAdmin,
  requireOwnershipOrAdmin,
  logActivity
};
