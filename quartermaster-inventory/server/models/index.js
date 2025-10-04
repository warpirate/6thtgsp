const { pool } = require('../config/database');

// User model
class UserModel {
  static async findById(id) {
    const result = await pool.query(
      'SELECT id, username, full_name, rank, service_number, role, email, is_active, created_at, updated_at, last_login FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUsername(username) {
    const result = await pool.query(
      'SELECT id, username, password_hash, full_name, rank, service_number, role, email, is_active, created_at, updated_at, last_login FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT id, username, full_name, rank, service_number, role, email, is_active, created_at, updated_at, last_login
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (filters.role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(filters.role);
    }

    if (filters.is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(filters.is_active);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async create(userData) {
    const { username, password_hash, full_name, rank, service_number, role, email } = userData;
    const result = await pool.query(`
      INSERT INTO users (username, password_hash, full_name, rank, service_number, role, email)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, username, full_name, rank, service_number, role, email, is_active, created_at, updated_at
    `, [username, password_hash, full_name, rank, service_number, role, email]);

    return result.rows[0];
  }

  static async update(id, userData) {
    const { full_name, rank, service_number, role, email, is_active } = userData;
    const result = await pool.query(`
      UPDATE users
      SET full_name = $1, rank = $2, service_number = $3, role = $4, email = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, username, full_name, rank, service_number, role, email, is_active, created_at, updated_at
    `, [full_name, rank, service_number, role, email, is_active, id]);

    return result.rows[0] || null;
  }

  static async updateLastLogin(id) {
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  static async updatePassword(id, passwordHash) {
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, id]
    );
  }
}

// Item model
class ItemModel {
  static async findAll(filters = {}) {
    let query = `
      SELECT id, item_code, nomenclature, category, unit_of_measure, description, is_active, created_at, updated_at, created_by
      FROM items_master
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (filters.category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(filters.category);
    }

    if (filters.is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(filters.is_active);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (item_code ILIKE $${paramCount} OR nomenclature ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    query += ' ORDER BY nomenclature';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, item_code, nomenclature, category, unit_of_measure, description, is_active, created_at, updated_at, created_by FROM items_master WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByCode(itemCode) {
    const result = await pool.query(
      'SELECT id, item_code, nomenclature, category, unit_of_measure, description, is_active, created_at, updated_at, created_by FROM items_master WHERE item_code = $1',
      [itemCode]
    );
    return result.rows[0] || null;
  }

  static async create(itemData) {
    const { item_code, nomenclature, category, unit_of_measure, description, created_by } = itemData;
    const result = await pool.query(`
      INSERT INTO items_master (item_code, nomenclature, category, unit_of_measure, description, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, item_code, nomenclature, category, unit_of_measure, description, is_active, created_at, updated_at, created_by
    `, [item_code, nomenclature, category, unit_of_measure, description, created_by]);

    return result.rows[0];
  }

  static async update(id, itemData) {
    const { item_code, nomenclature, category, unit_of_measure, description, is_active } = itemData;
    const result = await pool.query(`
      UPDATE items_master
      SET item_code = $1, nomenclature = $2, category = $3, unit_of_measure = $4, description = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, item_code, nomenclature, category, unit_of_measure, description, is_active, created_at, updated_at, created_by
    `, [item_code, nomenclature, category, unit_of_measure, description, is_active, id]);

    return result.rows[0] || null;
  }
}

// Stock receipt model
class StockReceiptModel {
  static async findAll(filters = {}) {
    let query = `
      SELECT
        sr.id, sr.grn_number, sr.receipt_date, sr.challan_number, sr.challan_date,
        sr.supplier_name, sr.vehicle_number, sr.status, sr.remarks,
        sr.created_at, sr.updated_at,
        u.full_name as received_by_name,
        v.full_name as verified_by_name,
        a.full_name as approved_by_name
      FROM stock_receipts sr
      JOIN users u ON sr.received_by = u.id
      LEFT JOIN users v ON sr.verified_by = v.id
      LEFT JOIN users a ON sr.approved_by = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (filters.status) {
      paramCount++;
      query += ` AND sr.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.received_by) {
      paramCount++;
      query += ` AND sr.received_by = $${paramCount}`;
      params.push(filters.received_by);
    }

    if (filters.date_from) {
      paramCount++;
      query += ` AND sr.receipt_date >= $${paramCount}`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      paramCount++;
      query += ` AND sr.receipt_date <= $${paramCount}`;
      params.push(filters.date_to);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (sr.grn_number ILIKE $${paramCount} OR sr.challan_number ILIKE $${paramCount} OR sr.supplier_name ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    query += ' ORDER BY sr.created_at DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT
        sr.id, sr.grn_number, sr.receipt_date, sr.challan_number, sr.challan_date,
        sr.supplier_name, sr.vehicle_number, sr.status, sr.remarks,
        sr.created_at, sr.updated_at, sr.verified_at, sr.approved_at,
        u.full_name as received_by_name, u.rank as received_by_rank, u.service_number as received_by_service_number,
        v.full_name as verified_by_name,
        a.full_name as approved_by_name
      FROM stock_receipts sr
      JOIN users u ON sr.received_by = u.id
      LEFT JOIN users v ON sr.verified_by = v.id
      LEFT JOIN users a ON sr.approved_by = a.id
      WHERE sr.id = $1
    `, [id]);

    return result.rows[0] || null;
  }

  static async findWithItems(id) {
    const receipt = await this.findById(id);
    if (!receipt) return null;

    const itemsResult = await pool.query(`
      SELECT
        ri.id, ri.challan_quantity, ri.received_quantity, ri.variance,
        ri.unit_rate, ri.total_value, ri.condition_notes, ri.created_at,
        im.item_code, im.nomenclature, im.category, im.unit_of_measure
      FROM receipt_items ri
      JOIN items_master im ON ri.item_id = im.id
      WHERE ri.receipt_id = $1
      ORDER BY ri.created_at
    `, [id]);

    return {
      ...receipt,
      items: itemsResult.rows
    };
  }

  static async create(receiptData) {
    const {
      receipt_date, challan_number, challan_date, supplier_name,
      vehicle_number, received_by, remarks
    } = receiptData;

    const result = await pool.query(`
      INSERT INTO stock_receipts (receipt_date, challan_number, challan_date, supplier_name, vehicle_number, received_by, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, grn_number, receipt_date, challan_number, challan_date, supplier_name, vehicle_number, status, remarks, created_at, updated_at
    `, [receipt_date, challan_number, challan_date, supplier_name, vehicle_number, received_by, remarks]);

    return result.rows[0];
  }

  static async update(id, receiptData) {
    const {
      receipt_date, challan_number, challan_date, supplier_name,
      vehicle_number, remarks
    } = receiptData;

    const result = await pool.query(`
      UPDATE stock_receipts
      SET receipt_date = $1, challan_number = $2, challan_date = $3, supplier_name = $4, vehicle_number = $5, remarks = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, grn_number, receipt_date, challan_number, challan_date, supplier_name, vehicle_number, status, remarks, created_at, updated_at
    `, [receipt_date, challan_number, challan_date, supplier_name, vehicle_number, remarks, id]);

    return result.rows[0] || null;
  }

  static async updateStatus(id, status, userId) {
    let query = 'UPDATE stock_receipts SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const params = [status, id];

    if (status === 'verified') {
      query += ', verified_by = $3, verified_at = CURRENT_TIMESTAMP';
      params.push(userId);
    } else if (status === 'approved') {
      query += ', approved_by = $3, approved_at = CURRENT_TIMESTAMP';
      params.push(userId);
    }

    query += ' WHERE id = $' + params.length + ' RETURNING *';
    params.push(id);

    const result = await pool.query(query, params);
    return result.rows[0] || null;
  }

  static async addItems(receiptId, items) {
    for (const item of items) {
      await pool.query(`
        INSERT INTO receipt_items (receipt_id, item_id, challan_quantity, received_quantity, unit_rate, condition_notes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        receiptId,
        item.item_id,
        item.challan_quantity,
        item.received_quantity,
        item.unit_rate,
        item.condition_notes
      ]);
    }
  }

  static async updateItems(receiptId, items) {
    // Delete existing items
    await pool.query('DELETE FROM receipt_items WHERE receipt_id = $1', [receiptId]);

    // Insert new items
    for (const item of items) {
      await pool.query(`
        INSERT INTO receipt_items (receipt_id, item_id, challan_quantity, received_quantity, unit_rate, condition_notes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        receiptId,
        item.item_id,
        item.challan_quantity,
        item.received_quantity,
        item.unit_rate,
        item.condition_notes
      ]);
    }
  }
}

// Document model
class DocumentModel {
  static async findByReceiptId(receiptId) {
    const result = await pool.query(
      'SELECT id, file_name, file_path, file_type, file_size, uploaded_by, uploaded_at FROM documents WHERE receipt_id = $1 ORDER BY uploaded_at',
      [receiptId]
    );
    return result.rows;
  }

  static async create(documentData) {
    const { receipt_id, file_name, file_path, file_type, file_size, uploaded_by } = documentData;
    const result = await pool.query(`
      INSERT INTO documents (receipt_id, file_name, file_path, file_type, file_size, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, file_name, file_path, file_type, file_size, uploaded_by, uploaded_at
    `, [receipt_id, file_name, file_path, file_type, file_size, uploaded_by]);

    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM documents WHERE id = $1 RETURNING file_path',
      [id]
    );
    return result.rows[0] || null;
  }
}

// Audit log model
class AuditLogModel {
  static async findByUser(userId, filters = {}) {
    let query = `
      SELECT id, action, table_name, record_id, old_value, new_value, ip_address, timestamp
      FROM audit_logs
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    if (filters.date_from) {
      paramCount++;
      query += ` AND timestamp >= $${paramCount}`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      paramCount++;
      query += ` AND timestamp <= $${paramCount}`;
      params.push(filters.date_to);
    }

    if (filters.action) {
      paramCount++;
      query += ` AND action = $${paramCount}`;
      params.push(filters.action);
    }

    query += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByReceipt(receiptId, filters = {}) {
    let query = `
      SELECT
        al.id, al.action, al.table_name, al.old_value, al.new_value, al.ip_address, al.timestamp,
        u.full_name as user_name, u.rank, u.service_number
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.table_name IN ('stock_receipts', 'receipt_items', 'approval_workflow')
        AND (al.record_id = $1 OR al.record_id IN (
          SELECT id FROM receipt_items WHERE receipt_id = $1
        ))
    `;
    const params = [receiptId];
    let paramCount = 1;

    if (filters.date_from) {
      paramCount++;
      query += ` AND al.timestamp >= $${paramCount}`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      paramCount++;
      query += ` AND al.timestamp <= $${paramCount}`;
      params.push(filters.date_to);
    }

    query += ' ORDER BY al.timestamp DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT
        al.id, al.action, al.table_name, al.record_id, al.old_value, al.new_value, al.ip_address, al.timestamp,
        u.full_name as user_name, u.rank, u.service_number
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (filters.user_id) {
      paramCount++;
      query += ` AND al.user_id = $${paramCount}`;
      params.push(filters.user_id);
    }

    if (filters.action) {
      paramCount++;
      query += ` AND al.action = $${paramCount}`;
      params.push(filters.action);
    }

    if (filters.table_name) {
      paramCount++;
      query += ` AND al.table_name = $${paramCount}`;
      params.push(filters.table_name);
    }

    if (filters.date_from) {
      paramCount++;
      query += ` AND al.timestamp >= $${paramCount}`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      paramCount++;
      query += ` AND al.timestamp <= $${paramCount}`;
      params.push(filters.date_to);
    }

    query += ' ORDER BY al.timestamp DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }
}

// Approval workflow model
class ApprovalWorkflowModel {
  static async findByReceipt(receiptId) {
    const result = await pool.query(`
      SELECT
        aw.id, aw.action, aw.comments, aw.action_date,
        u.full_name as approver_name, u.rank, u.service_number
      FROM approval_workflow aw
      JOIN users u ON aw.approver_id = u.id
      WHERE aw.receipt_id = $1
      ORDER BY aw.action_date
    `, [receiptId]);
    return result.rows;
  }

  static async addWorkflowEntry(workflowData) {
    const { receipt_id, approver_id, action, comments } = workflowData;
    const result = await pool.query(`
      INSERT INTO approval_workflow (receipt_id, approver_id, action, comments)
      VALUES ($1, $2, $3, $4)
      RETURNING id, action, comments, action_date
    `, [receipt_id, approver_id, action, comments]);

    return result.rows[0];
  }
}

module.exports = {
  UserModel,
  ItemModel,
  StockReceiptModel,
  DocumentModel,
  AuditLogModel,
  ApprovalWorkflowModel
};
