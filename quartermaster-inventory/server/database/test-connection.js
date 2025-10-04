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

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  const dbType = process.env.DATABASE_URL ? 'Supabase' : 'Local PostgreSQL';
  console.log(`📊 Database Type: ${dbType}`);
  
  if (process.env.DATABASE_URL) {
    const cleanUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
    console.log(`🔗 Connection URL: ${cleanUrl}`);
  } else {
    console.log(`🔗 Host: ${poolConfig.host}`);
    console.log(`🔗 Port: ${poolConfig.port}`);
    console.log(`🔗 Database: ${poolConfig.database}`);
    console.log(`🔗 User: ${poolConfig.user}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');

  try {
    // Test basic connection
    console.log('1️⃣  Testing basic connection...');
    const client = await pool.connect();
    console.log('   ✅ Connection successful!\n');

    // Check PostgreSQL version
    console.log('2️⃣  Checking PostgreSQL version...');
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version.split(' ')[1];
    console.log(`   ✅ PostgreSQL Version: ${version}\n`);

    // Check if tables exist
    console.log('3️⃣  Checking database schema...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  No tables found. Run migrations: npm run db:migrate\n');
    } else {
      console.log(`   ✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`      - ${row.table_name}`);
      });
      console.log('');
    }

    // Check for admin user
    console.log('4️⃣  Checking for admin user...');
    try {
      const adminResult = await client.query(
        'SELECT username, full_name, role FROM users WHERE username = $1',
        ['admin']
      );
      
      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0];
        console.log(`   ✅ Admin user exists:`);
        console.log(`      Username: ${admin.username}`);
        console.log(`      Name: ${admin.full_name}`);
        console.log(`      Role: ${admin.role}\n`);
      } else {
        console.log('   ⚠️  No admin user found. Run seed: npm run db:seed\n');
      }
    } catch (err) {
      console.log('   ⚠️  Users table not found. Run migrations first.\n');
    }

    // Check database size (if available)
    console.log('5️⃣  Checking database statistics...');
    try {
      const statsResult = await client.query(`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as db_size,
          (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as connections
      `);
      
      if (statsResult.rows.length > 0) {
        console.log(`   ✅ Database Size: ${statsResult.rows[0].db_size}`);
        console.log(`   ✅ Active Connections: ${statsResult.rows[0].connections}\n`);
      }
    } catch (err) {
      console.log('   ℹ️  Database statistics not available\n');
    }

    // Check extensions
    console.log('6️⃣  Checking required extensions...');
    try {
      const extResult = await client.query(`
        SELECT extname, extversion 
        FROM pg_extension 
        WHERE extname = 'uuid-ossp'
      `);
      
      if (extResult.rows.length > 0) {
        console.log(`   ✅ uuid-ossp extension: v${extResult.rows[0].extversion}\n`);
      } else {
        console.log('   ⚠️  uuid-ossp extension not found. Run migrations.\n');
      }
    } catch (err) {
      console.log('   ⚠️  Could not check extensions\n');
    }

    client.release();
    
    console.log('='.repeat(50));
    console.log('\n✅ All connection tests passed!');
    console.log('\n📝 Next steps:');
    
    if (tablesResult.rows.length === 0) {
      console.log('   1. Run migrations: npm run db:migrate');
      console.log('   2. Seed database: npm run db:seed');
      console.log('   3. Start server: npm run dev');
    } else {
      console.log('   1. Start server: npm run dev');
      console.log('   2. Visit: http://localhost:5000/api/health');
      console.log('   3. Login with: admin / Admin@123');
    }
    
  } catch (error) {
    console.error('\n❌ Connection test failed!');
    console.error('\n🔍 Error Details:');
    console.error(`   ${error.message}\n`);
    
    console.log('🔧 Troubleshooting:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   - Check if PostgreSQL is running');
      console.log('   - Verify host and port in .env file');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   - Check your internet connection (for Supabase)');
      console.log('   - Verify the DATABASE_URL is correct');
    } else if (error.message.includes('password')) {
      console.log('   - Verify database password in .env file');
      console.log('   - For Supabase: Check connection string password');
    } else if (error.message.includes('SSL')) {
      console.log('   - SSL configuration issue (should be auto-handled)');
      console.log('   - Check if DATABASE_URL is set correctly');
    } else {
      console.log('   - Check your .env file configuration');
      console.log('   - Verify all database credentials');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
if (require.main === module) {
  testConnection();
}

module.exports = { testConnection };
