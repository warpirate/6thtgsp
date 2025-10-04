const express = require('express');
const router = express.Router();
const { AuditLogModel } = require('../models');
const { requireAdmin, logActivity } = require('../middleware/auth');

// Get audit logs with filters
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { user_id, action, table_name, date_from, date_to, limit } = req.query;

    const filters = {
      user_id,
      action,
      table_name,
      date_from,
      date_to,
      limit: limit ? parseInt(limit) : 100
    };

    const logs = await AuditLogModel.findAll(filters);

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit trail for a specific receipt
router.get('/receipt/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date_from, date_to, limit } = req.query;

    const filters = {
      date_from,
      date_to,
      limit: limit ? parseInt(limit) : 50
    };

    const logs = await AuditLogModel.findByReceipt(id, filters);

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Get receipt audit trail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
