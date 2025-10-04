const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const {
  validateItem,
  validateId,
  handleValidationErrors
} = require('../middleware/validation');
const { requireAdmin, logActivity } = require('../middleware/auth');

// Item management routes
router.get('/', itemController.getAllItems);
router.get('/stats', itemController.getItemStats);
router.get('/category/:category', itemController.getItemsByCategory);
router.get('/search', itemController.searchItems);
router.get('/:id', validateId, handleValidationErrors, itemController.getItemById);
router.post('/', requireAdmin, validateItem, handleValidationErrors, logActivity('create', 'items_master'), itemController.createItem);
router.put('/:id', requireAdmin, validateItem, handleValidationErrors, logActivity('update', 'items_master'), itemController.updateItem);

module.exports = router;
