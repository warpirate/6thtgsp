const { body, param, validationResult } = require('express-validator');
const { pool } = require('../config/database');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUser = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('full_name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('role')
    .isIn(['semi_user', 'user', 'admin', 'super_admin'])
    .withMessage('Invalid role specified'),

  body('rank')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Rank must not exceed 50 characters'),

  body('service_number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Service number must not exceed 50 characters')
];

// Login validation rules
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Stock receipt validation rules
const validateStockReceipt = [
  body('receipt_date')
    .isISO8601()
    .withMessage('Receipt date must be a valid date')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Receipt date cannot be in the future');
      }
      return true;
    }),

  body('challan_number')
    .isLength({ min: 1, max: 100 })
    .withMessage('Challan number is required and must not exceed 100 characters'),

  body('challan_date')
    .isISO8601()
    .withMessage('Challan date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) > new Date(req.body.receipt_date)) {
        throw new Error('Challan date cannot be after receipt date');
      }
      return true;
    }),

  body('supplier_name')
    .isLength({ min: 1, max: 200 })
    .withMessage('Supplier name is required and must not exceed 200 characters'),

  body('vehicle_number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Vehicle number must not exceed 50 characters'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),

  body('items.*.item_id')
    .isUUID()
    .withMessage('Invalid item ID'),

  body('items.*.challan_quantity')
    .isFloat({ min: 0 })
    .withMessage('Challan quantity must be a positive number'),

  body('items.*.received_quantity')
    .isFloat({ min: 0 })
    .withMessage('Received quantity must be a positive number'),

  body('items.*.unit_rate')
    .isFloat({ min: 0 })
    .withMessage('Unit rate must be a positive number'),

  body('items.*.condition_notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Condition notes must not exceed 500 characters')
];

// Item validation rules
const validateItem = [
  body('item_code')
    .isLength({ min: 1, max: 50 })
    .withMessage('Item code is required and must not exceed 50 characters'),

  body('nomenclature')
    .isLength({ min: 1, max: 200 })
    .withMessage('Nomenclature is required and must not exceed 200 characters'),

  body('category')
    .isIn(['consumable', 'non_consumable', 'sensitive', 'capital_asset'])
    .withMessage('Invalid category'),

  body('unit_of_measure')
    .isLength({ min: 1, max: 20 })
    .withMessage('Unit of measure is required and must not exceed 20 characters'),

  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
];

// ID parameter validation
const validateId = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format')
];

// Custom validation functions
const checkUsernameExists = async (username, { req }) => {
  if (req.params.id) {
    // For updates, exclude current user
    const result = await pool.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, req.params.id]
    );
    if (result.rows.length > 0) {
      throw new Error('Username already exists');
    }
  } else {
    // For new users
    const result = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (result.rows.length > 0) {
      throw new Error('Username already exists');
    }
  }
  return true;
};

const checkEmailExists = async (email, { req }) => {
  if (!email) return true; // Email is optional

  if (req.params.id) {
    // For updates, exclude current user
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, req.params.id]
    );
    if (result.rows.length > 0) {
      throw new Error('Email already exists');
    }
  } else {
    // For new users
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length > 0) {
      throw new Error('Email already exists');
    }
  }
  return true;
};

const checkItemExists = async (itemId) => {
  const result = await pool.query(
    'SELECT id FROM items_master WHERE id = $1 AND is_active = true',
    [itemId]
  );
  if (result.rows.length === 0) {
    throw new Error('Item not found or inactive');
  }
  return true;
};

const checkReceiptExists = async (receiptId) => {
  const result = await pool.query(
    'SELECT id, status, received_by FROM stock_receipts WHERE id = $1',
    [receiptId]
  );
  if (result.rows.length === 0) {
    throw new Error('Receipt not found');
  }
  return result.rows[0];
};

// Add custom validators to validation chains
const validateUserWithCustom = [
  ...validateUser,
  body('username').custom(checkUsernameExists),
  body('email').custom(checkEmailExists)
];

const validateStockReceiptWithCustom = [
  ...validateStockReceipt,
  body('items.*.item_id').custom(checkItemExists)
];

const validateItemId = [
  ...validateId,
  param('id').custom(async (itemId) => {
    return checkItemExists(itemId);
  })
];

const validateReceiptId = [
  ...validateId,
  param('id').custom(async (receiptId, { req }) => {
    const receipt = await checkReceiptExists(receiptId);
    req.receipt = receipt; // Store receipt info for later use
    return true;
  })
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateUser,
  validateUserWithCustom,
  validateStockReceipt,
  validateStockReceiptWithCustom,
  validateItem,
  validateId,
  validateItemId,
  validateReceiptId,
  checkUsernameExists,
  checkEmailExists,
  checkItemExists,
  checkReceiptExists
};
