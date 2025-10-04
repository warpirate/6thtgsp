const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const {
  validateUserWithCustom,
  validateId,
  handleValidationErrors
} = require('../middleware/validation');
const { requireSuperAdmin, logActivity } = require('../middleware/auth');

// User management routes (Super Admin only)
router.get('/', requireSuperAdmin, userController.getAllUsers);
router.get('/:id', requireSuperAdmin, validateId, handleValidationErrors, userController.getUserById);
router.post('/', requireSuperAdmin, validateUserWithCustom, handleValidationErrors, logActivity('create', 'users'), userController.createUser);
router.put('/:id', requireSuperAdmin, validateUserWithCustom, handleValidationErrors, logActivity('update', 'users'), userController.updateUser);
router.post('/:id/deactivate', requireSuperAdmin, validateId, handleValidationErrors, logActivity('update', 'users'), userController.deactivateUser);
router.post('/:id/activate', requireSuperAdmin, validateId, handleValidationErrors, logActivity('update', 'users'), userController.activateUser);
router.post('/:id/reset-password', requireSuperAdmin, validateId, handleValidationErrors, logActivity('update', 'users'), userController.resetPassword);
router.get('/:id/activity', requireSuperAdmin, validateId, handleValidationErrors, userController.getUserActivity);

module.exports = router;
