const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAdmin, logActivity } = require('../middleware/auth');

// Report routes
router.get('/receipt-register', reportController.getReceiptRegister);
router.get('/item-history/:itemId', reportController.getItemHistory);
router.get('/pending-approvals', requireAdmin, reportController.getPendingApprovals);
router.get('/user-activity', requireSuperAdmin, reportController.getUserActivity);
router.get('/system-stats', reportController.getSystemStats);

// Export routes
router.get('/export/:report_type', reportController.exportReport);

module.exports = router;
