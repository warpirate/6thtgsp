const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const {
  validateStockReceiptWithCustom,
  validateReceiptId,
  validateId,
  handleValidationErrors
} = require('../middleware/validation');
const {
  requireUser,
  requireAdmin,
  requireSuperAdmin,
  requireOwnershipOrAdmin,
  logActivity
} = require('../middleware/auth');
const { config } = require('../config/database');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.upload.dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: function (req, file, cb) {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'), false);
    }
  }
});

// Receipt management routes
router.get('/', receiptController.getAllReceipts);
router.get('/stats', receiptController.getReceiptStats);
router.get('/:id', validateReceiptId, handleValidationErrors, receiptController.getReceiptById);

// User routes (create, update drafts)
router.post('/', requireUser, validateStockReceiptWithCustom, handleValidationErrors, logActivity('create', 'stock_receipts'), receiptController.createReceipt);
router.put('/:id', requireUser, validateReceiptId, validateStockReceiptWithCustom, handleValidationErrors, logActivity('update', 'stock_receipts'), receiptController.updateReceipt);
router.post('/:id/submit', requireUser, validateReceiptId, handleValidationErrors, logActivity('update', 'stock_receipts'), receiptController.submitReceipt);

// Admin routes (verify)
router.post('/:id/verify', requireAdmin, validateReceiptId, handleValidationErrors, logActivity('update', 'stock_receipts'), receiptController.verifyReceipt);

// Super Admin routes (approve)
router.post('/:id/approve', requireSuperAdmin, validateReceiptId, handleValidationErrors, logActivity('update', 'stock_receipts'), receiptController.approveReceipt);

// Document management
router.post('/:id/documents', requireOwnershipOrAdmin, upload.single('document'), logActivity('create', 'documents'), receiptController.uploadDocument);
router.delete('/documents/:documentId', requireOwnershipOrAdmin, validateId, handleValidationErrors, logActivity('delete', 'documents'), receiptController.deleteDocument);

module.exports = router;
