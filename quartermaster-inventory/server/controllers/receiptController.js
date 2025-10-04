const { StockReceiptModel, DocumentModel, ApprovalWorkflowModel } = require('../models');
const fs = require('fs');
const path = require('path');

// Get all receipts with role-based filtering
const getAllReceipts = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      received_by: req.user.role === 'user' ? req.user.id : req.query.received_by,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      search: req.query.search,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const receipts = await StockReceiptModel.findAll(filters);

    res.json({
      success: true,
      data: receipts,
      count: receipts.length
    });
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get receipt by ID with items
const getReceiptById = async (req, res) => {
  try {
    const receipt = await StockReceiptModel.findWithItems(req.params.id);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Check permissions
    if (req.user.role === 'user' && receipt.received_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get documents
    const documents = await DocumentModel.findByReceiptId(receipt.id);

    // Get workflow history
    const workflow = await ApprovalWorkflowModel.findByReceipt(receipt.id);

    res.json({
      success: true,
      data: {
        ...receipt,
        documents,
        workflow
      }
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new receipt (User only)
const createReceipt = async (req, res) => {
  try {
    const {
      receipt_date,
      challan_number,
      challan_date,
      supplier_name,
      vehicle_number,
      items,
      remarks
    } = req.body;

    // Create receipt
    const newReceipt = await StockReceiptModel.create({
      receipt_date,
      challan_number,
      challan_date,
      supplier_name,
      vehicle_number,
      received_by: req.user.id,
      remarks
    });

    // Add items
    if (items && items.length > 0) {
      await StockReceiptModel.addItems(newReceipt.id, items);
    }

    // Get complete receipt with items
    const receiptWithItems = await StockReceiptModel.findWithItems(newReceipt.id);

    res.status(201).json({
      success: true,
      message: 'Receipt created successfully',
      data: receiptWithItems
    });
  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update receipt (User only, for drafts)
const updateReceipt = async (req, res) => {
  try {
    const receiptId = req.params.id;
    const {
      receipt_date,
      challan_number,
      challan_date,
      supplier_name,
      vehicle_number,
      items,
      remarks
    } = req.body;

    // Check if receipt exists and is in draft status
    const existingReceipt = await StockReceiptModel.findById(receiptId);
    if (!existingReceipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (existingReceipt.received_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (existingReceipt.status !== 'draft') {
      return res.status(400).json({ error: 'Can only update draft receipts' });
    }

    // Update receipt
    const updatedReceipt = await StockReceiptModel.update(receiptId, {
      receipt_date,
      challan_number,
      challan_date,
      supplier_name,
      vehicle_number,
      remarks
    });

    // Update items
    if (items && items.length > 0) {
      await StockReceiptModel.updateItems(receiptId, items);
    }

    // Get complete receipt with items
    const receiptWithItems = await StockReceiptModel.findWithItems(receiptId);

    res.json({
      success: true,
      message: 'Receipt updated successfully',
      data: receiptWithItems
    });
  } catch (error) {
    console.error('Update receipt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit receipt for verification (User only)
const submitReceipt = async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Check if receipt exists and user owns it
    const existingReceipt = await StockReceiptModel.findById(receiptId);
    if (!existingReceipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (existingReceipt.received_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (existingReceipt.status !== 'draft') {
      return res.status(400).json({ error: 'Receipt is not in draft status' });
    }

    // Update status to submitted
    const updatedReceipt = await StockReceiptModel.updateStatus(receiptId, 'submitted', req.user.id);

    // Add workflow entry
    await ApprovalWorkflowModel.addWorkflowEntry({
      receipt_id: receiptId,
      approver_id: req.user.id,
      action: 'submitted',
      comments: 'Receipt submitted for verification'
    });

    res.json({
      success: true,
      message: 'Receipt submitted for verification',
      data: updatedReceipt
    });
  } catch (error) {
    console.error('Submit receipt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify receipt (Admin only)
const verifyReceipt = async (req, res) => {
  try {
    const receiptId = req.params.id;
    const { action, comments } = req.body; // action can be 'verified' or 'rejected'

    // Check if receipt exists
    const existingReceipt = await StockReceiptModel.findById(receiptId);
    if (!existingReceipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (existingReceipt.status !== 'submitted') {
      return res.status(400).json({ error: 'Receipt is not in submitted status' });
    }

    let newStatus;
    if (action === 'verify') {
      newStatus = 'verified';
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Update status
    const updatedReceipt = await StockReceiptModel.updateStatus(receiptId, newStatus, req.user.id);

    // Add workflow entry
    await ApprovalWorkflowModel.addWorkflowEntry({
      receipt_id: receiptId,
      approver_id: req.user.id,
      action: action === 'verify' ? 'verified' : 'rejected',
      comments: comments || `${action === 'verify' ? 'Verified' : 'Rejected'} by admin`
    });

    res.json({
      success: true,
      message: `Receipt ${action === 'verify' ? 'verified' : 'rejected'} successfully`,
      data: updatedReceipt
    });
  } catch (error) {
    console.error('Verify receipt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Approve receipt (Super Admin only)
const approveReceipt = async (req, res) => {
  try {
    const receiptId = req.params.id;
    const { action, comments } = req.body; // action can be 'approved' or 'rejected'

    // Check if receipt exists
    const existingReceipt = await StockReceiptModel.findById(receiptId);
    if (!existingReceipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (existingReceipt.status !== 'verified') {
      return res.status(400).json({ error: 'Receipt is not in verified status' });
    }

    let newStatus;
    if (action === 'approve') {
      newStatus = 'approved';
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Update status
    const updatedReceipt = await StockReceiptModel.updateStatus(receiptId, newStatus, req.user.id);

    // Add workflow entry
    await ApprovalWorkflowModel.addWorkflowEntry({
      receipt_id: receiptId,
      approver_id: req.user.id,
      action: action === 'approve' ? 'approved' : 'rejected',
      comments: comments || `${action === 'approve' ? 'Approved' : 'Rejected'} by super admin`
    });

    res.json({
      success: true,
      message: `Receipt ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: updatedReceipt
    });
  } catch (error) {
    console.error('Approve receipt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload document for receipt
const uploadDocument = async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Check if receipt exists
    const existingReceipt = await StockReceiptModel.findById(receiptId);
    if (!existingReceipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Check permissions
    if (req.user.role === 'user' && existingReceipt.received_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create document record
    const document = await DocumentModel.create({
      receipt_id: receiptId,
      file_name: req.file.originalname,
      file_path: req.file.path,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      uploaded_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const documentId = req.params.documentId;

    // Get document info
    const pool = require('../config/database').pool;
    const docResult = await pool.query(
      'SELECT file_path FROM documents WHERE id = $1',
      [documentId]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = docResult.rows[0].file_path;

    // Delete from database
    await DocumentModel.delete(documentId);

    // Delete physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get receipt statistics
const getReceiptStats = async (req, res) => {
  try {
    const pool = require('../config/database').pool;

    // Get status-wise counts
    const statusStats = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM stock_receipts
      GROUP BY status
      ORDER BY status
    `);

    // Get monthly trend (last 12 months)
    const monthlyStats = await pool.query(`
      SELECT
        DATE_TRUNC('month', receipt_date) as month,
        COUNT(*) as count,
        SUM(total_value) as total_value
      FROM (
        SELECT
          sr.receipt_date,
          COALESCE(SUM(ri.total_value), 0) as total_value
        FROM stock_receipts sr
        LEFT JOIN receipt_items ri ON sr.id = ri.receipt_id
        WHERE sr.receipt_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY sr.id, sr.receipt_date
      ) monthly_data
      GROUP BY DATE_TRUNC('month', receipt_date)
      ORDER BY month DESC
    `);

    // Get pending counts by role
    const pendingCounts = {};
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      const pendingVerifications = await pool.query(
        'SELECT COUNT(*) as count FROM stock_receipts WHERE status = $1',
        ['submitted']
      );
      pendingCounts.verifications = parseInt(pendingVerifications.rows[0].count);
    }

    if (req.user.role === 'super_admin') {
      const pendingApprovals = await pool.query(
        'SELECT COUNT(*) as count FROM stock_receipts WHERE status = $1',
        ['verified']
      );
      pendingCounts.approvals = parseInt(pendingApprovals.rows[0].count);
    }

    res.json({
      success: true,
      data: {
        status_breakdown: statusStats.rows.map(row => ({
          status: row.status,
          count: parseInt(row.count)
        })),
        monthly_trend: monthlyStats.rows.map(row => ({
          month: row.month,
          count: parseInt(row.count),
          total_value: parseFloat(row.total_value || 0)
        })),
        pending_counts: pendingCounts
      }
    });
  } catch (error) {
    console.error('Get receipt stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  submitReceipt,
  verifyReceipt,
  approveReceipt,
  uploadDocument,
  deleteDocument,
  getReceiptStats
};
