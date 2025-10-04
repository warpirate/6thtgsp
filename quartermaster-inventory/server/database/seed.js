const bcrypt = require('bcrypt');
const { Pool } = require('pg');

require('dotenv').config();

// Configure pool for both Supabase and traditional PostgreSQL
const poolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'quartermaster_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool(poolConfig);

async function seedDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const dbType = process.env.DATABASE_URL ? 'Supabase' : 'PostgreSQL';
    console.log(`Seeding ${dbType} database with initial data...`);

    // Check if admin user already exists
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists, skipping seed data');
      await client.query('ROLLBACK');
      return;
    }

    // Hash the default password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // Insert default super admin user
    const adminResult = await client.query(`
      INSERT INTO users (id, username, password_hash, full_name, role, email)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
      RETURNING id
    `, ['admin', hashedPassword, 'System Administrator', 'super_admin', 'admin@quartermaster.gov']);

    const adminId = adminResult.rows[0].id;

    // Insert sample items
    const sampleItems = [
      {
        item_code: 'ITM001',
        nomenclature: 'Office Chair',
        category: 'non_consumable',
        unit_of_measure: 'Each',
        description: 'Standard office chair for administrative use'
      },
      {
        item_code: 'ITM002',
        nomenclature: 'A4 Paper',
        category: 'consumable',
        unit_of_measure: 'Ream',
        description: 'Standard A4 printing paper, 500 sheets per ream'
      },
      {
        item_code: 'ITM003',
        nomenclature: 'Desktop Computer',
        category: 'capital_asset',
        unit_of_measure: 'Each',
        description: 'Standard desktop computer with monitor'
      },
      {
        item_code: 'ITM004',
        nomenclature: 'Ball Pen Blue',
        category: 'consumable',
        unit_of_measure: 'Box',
        description: 'Box of 50 blue ball pens'
      },
      {
        item_code: 'ITM005',
        nomenclature: 'Printer Toner',
        category: 'consumable',
        unit_of_measure: 'Each',
        description: 'Toner cartridge for laser printer'
      }
    ];

    for (const item of sampleItems) {
      await client.query(`
        INSERT INTO items_master (item_code, nomenclature, category, unit_of_measure, description, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [item.item_code, item.nomenclature, item.category, item.unit_of_measure, item.description, adminId]);
    }

    // Insert sample stock receipt
    const receiptResult = await client.query(`
      INSERT INTO stock_receipts (grn_number, receipt_date, challan_number, challan_date, supplier_name, vehicle_number, received_by, status, remarks)
      VALUES ('GRN/2024/0001', CURRENT_DATE, 'CHL/HO/001', CURRENT_DATE - INTERVAL '2 days', 'Head Office Supply Division', 'MH-12-AB-1234', $1, 'approved', 'Initial sample receipt for system testing')
      RETURNING id
    `, [adminId]);

    const receiptId = receiptResult.rows[0].id;

    // Insert sample receipt items
    const itemsResult = await client.query('SELECT id, item_code FROM items_master LIMIT 2');
    const items = itemsResult.rows;

    if (items.length >= 2) {
      await client.query(`
        INSERT INTO receipt_items (receipt_id, item_id, challan_quantity, received_quantity, unit_rate, condition_notes)
        VALUES ($1, $2, 10.00, 10.00, 1500.00, 'Good condition')
      `, [receiptId, items[0].id]);

      await client.query(`
        INSERT INTO receipt_items (receipt_id, item_id, challan_quantity, received_quantity, unit_rate, condition_notes)
        VALUES ($1, $2, 5.00, 5.00, 250.00, 'Standard quality')
      `, [receiptId, items[1].id]);
    }

    // Insert sample workflow entry
    await client.query(`
      INSERT INTO approval_workflow (receipt_id, approver_id, action, comments)
      VALUES ($1, $2, 'approved', 'Sample approval for testing')
    `, [receiptId, adminId]);

    // Insert sample audit log
    await client.query(`
      INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
      VALUES ($1, 'login', 'users', $2, $3)
    `, [adminId, adminId, JSON.stringify({ timestamp: new Date().toISOString(), ip_address: '127.0.0.1' })]);

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully');
    console.log('Default credentials:');
    console.log('Username: admin');
    console.log('Password: Admin@123');
    console.log('⚠️  Please change the password after first login');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
