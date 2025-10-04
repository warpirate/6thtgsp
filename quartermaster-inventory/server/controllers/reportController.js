const { StockReceiptModel, ItemModel, AuditLogModel } = require('../models');
const { config } = require('../config/database');

// Stock Receipt Register Report
const getReceiptRegister = async (req, res) => {
  try {
    const { date_from, date_to, status, item_category, limit } = req.query;

    const filters = {
      date_from,
      date_to,
      status,
      limit: limit ? parseInt(limit) : 100
    };

    let receipts = await StockReceiptModel.findAll(filters);

    // If item category filter is specified, filter receipts that contain items of that category
    if (item_category) {
      const pool = require('../config/database').pool;

      const filteredReceipts = [];
      for (const receipt of receipts) {
        const itemsResult = await pool.query(`
          SELECT COUNT(*) as item_count
          FROM receipt_items ri
          JOIN items_master im ON ri.item_id = im.id
          WHERE ri.receipt_id = $1 AND im.category = $2
        `, [receipt.id, item_category]);

        if (parseInt(itemsResult.rows[0].item_count) > 0) {
          filteredReceipts.push(receipt);
        }
      }
      receipts = filteredReceipts;
    }

    res.json({
      success: true,
      data: receipts,
      count: receipts.length,
      filters: {
        date_from,
        date_to,
        status,
        item_category
      }
    });
  } catch (error) {
    console.error('Get receipt register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Item-wise Receipt History Report
const getItemHistory = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { date_from, date_to } = req.query;

    // Verify item exists
    const item = await ItemModel.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const pool = require('../config/database').pool;

    let query = `
      SELECT
        sr.id, sr.grn_number, sr.receipt_date, sr.challan_number, sr.supplier_name,
        sr.status, sr.created_at,
        ri.challan_quantity, ri.received_quantity, ri.unit_rate, ri.total_value,
        u.full_name as received_by_name
      FROM stock_receipts sr
      JOIN receipt_items ri ON sr.id = ri.receipt_id
      JOIN users u ON sr.received_by = u.id
      WHERE ri.item_id = $1
    `;
    const params = [itemId];
    let paramCount = 1;

    if (date_from) {
      paramCount++;
      query += ` AND sr.receipt_date >= $${paramCount}`;
      params.push(date_from);
    }

    if (date_to) {
      paramCount++;
      query += ` AND sr.receipt_date <= $${paramCount}`;
      params.push(date_to);
    }

    query += ' ORDER BY sr.receipt_date DESC';

    if (req.query.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(req.query.limit);
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        item: item,
        receipts: result.rows,
        count: result.rows.length
      },
      filters: {
        date_from,
        date_to,
        item_id: itemId
      }
    });
  } catch (error) {
    console.error('Get item history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Pending Approvals Report
const getPendingApprovals = async (req, res) => {
  try {
    const { type } = req.query; // 'verification' or 'approval'

    let status;
    if (type === 'verification') {
      status = 'submitted';
    } else if (type === 'approval') {
      status = 'verified';
    } else {
      return res.status(400).json({ error: 'Invalid type parameter' });
    }

    const receipts = await StockReceiptModel.findAll({
      status,
      limit: 50
    });

    res.json({
      success: true,
      data: receipts,
      count: receipts.length,
      type: type
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// User Activity Report (Super Admin only)
const getUserActivity = async (req, res) => {
  try {
    const { user_id, date_from, date_to, action, limit } = req.query;

    const filters = {
      user_id,
      date_from,
      date_to,
      action,
      limit: limit ? parseInt(limit) : 100
    };

    const activities = await AuditLogModel.findAll(filters);

    res.json({
      success: true,
      data: activities,
      count: activities.length,
      filters
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// System Statistics Report
const getSystemStats = async (req, res) => {
  try {
    const pool = require('../config/database').pool;

    // User statistics
    const userStats = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM users
      WHERE is_active = true
      GROUP BY role
      ORDER BY role
    `);

    // Receipt statistics by status
    const receiptStats = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM stock_receipts
      GROUP BY status
      ORDER BY status
    `);

    // Monthly receipt trend (last 6 months)
    const monthlyTrend = await pool.query(`
      SELECT
        DATE_TRUNC('month', receipt_date) as month,
        COUNT(*) as receipt_count,
        COUNT(DISTINCT received_by) as unique_users,
        SUM(total_value) as total_value
      FROM (
        SELECT
          sr.receipt_date,
          sr.received_by,
          COALESCE(SUM(ri.total_value), 0) as total_value
        FROM stock_receipts sr
        LEFT JOIN receipt_items ri ON sr.id = ri.receipt_id
        WHERE sr.receipt_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY sr.id, sr.receipt_date, sr.received_by
      ) monthly_data
      GROUP BY DATE_TRUNC('month', receipt_date)
      ORDER BY month DESC
    `);

    // Item statistics
    const itemStats = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM items_master
      WHERE is_active = true
      GROUP BY category
      ORDER BY category
    `);

    // Recent activity (last 7 days)
    const recentActivity = await pool.query(`
      SELECT
        action,
        COUNT(*) as count,
        MAX(timestamp) as latest_activity
      FROM audit_logs
      WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY action
      ORDER BY latest_activity DESC
    `);

    res.json({
      success: true,
      data: {
        users: {
          total: userStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
          by_role: userStats.rows.map(row => ({
            role: row.role,
            count: parseInt(row.count)
          }))
        },
        receipts: {
          total: receiptStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
          by_status: receiptStats.rows.map(row => ({
            status: row.status,
            count: parseInt(row.count)
          }))
        },
        monthly_trend: monthlyTrend.rows.map(row => ({
          month: row.month,
          receipt_count: parseInt(row.receipt_count),
          unique_users: parseInt(row.unique_users),
          total_value: parseFloat(row.total_value || 0)
        })),
        items: {
          total: itemStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
          by_category: itemStats.rows.map(row => ({
            category: row.category,
            count: parseInt(row.count)
          }))
        },
        recent_activity: recentActivity.rows.map(row => ({
          action: row.action,
          count: parseInt(row.count),
          latest_activity: row.latest_activity
        }))
      }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export report to CSV
const exportReport = async (req, res) => {
  try {
    const { report_type } = req.params;
    const { format = 'csv' } = req.query;

    let data, filename, headers;

    switch (report_type) {
      case 'receipt-register':
        const receipts = await StockReceiptModel.findAll({ limit: 1000 });
        data = receipts;
        filename = `receipt-register-${new Date().toISOString().split('T')[0]}`;
        headers = [
          'GRN Number', 'Receipt Date', 'Challan Number', 'Challan Date',
          'Supplier Name', 'Vehicle Number', 'Status', 'Received By', 'Created At'
        ];
        break;

      case 'item-history':
        const itemId = req.query.item_id;
        if (!itemId) {
          return res.status(400).json({ error: 'item_id parameter required' });
        }

        const item = await ItemModel.findById(itemId);
        if (!item) {
          return res.status(404).json({ error: 'Item not found' });
        }

        const pool = require('../config/database').pool;
        const itemHistory = await pool.query(`
          SELECT
            sr.grn_number, sr.receipt_date, sr.challan_number, sr.supplier_name,
            ri.challan_quantity, ri.received_quantity, ri.unit_rate, ri.total_value,
            u.full_name as received_by_name
          FROM stock_receipts sr
          JOIN receipt_items ri ON sr.id = ri.receipt_id
          JOIN users u ON sr.received_by = u.id
          WHERE ri.item_id = $1
          ORDER BY sr.receipt_date DESC
        `, [itemId]);

        data = itemHistory.rows;
        filename = `item-history-${item.item_code}-${new Date().toISOString().split('T')[0]}`;
        headers = [
          'GRN Number', 'Receipt Date', 'Challan Number', 'Supplier Name',
          'Challan Quantity', 'Received Quantity', 'Unit Rate', 'Total Value', 'Received By'
        ];
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = headers.join(',');
      const csvRows = data.map(row => {
        const values = headers.map(header => {
          const key = header.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
          return `"${(row[key] || '').toString().replace(/"/g, '""')}"`;
        });
        return values.join(',');
      });

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvContent);
    } else {
      return res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getReceiptRegister,
  getItemHistory,
  getPendingApprovals,
  getUserActivity,
  getSystemStats,
  exportReport
};
