const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController-supabase');
const {
  validateLogin,
  handleValidationErrors
} = require('../middleware/validation');

// Authentication routes (public)
router.post('/login', validateLogin, handleValidationErrors, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.post('/change-password', authController.changePassword);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
