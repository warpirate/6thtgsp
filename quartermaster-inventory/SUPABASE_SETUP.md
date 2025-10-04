# Supabase Setup Guide

This guide provides detailed instructions for setting up and deploying the Quarter Master Inventory Management System with Supabase.

## Why Supabase?

Supabase is a complete backend-as-a-service platform built on PostgreSQL. It offers:

- ✅ **Fully Managed PostgreSQL** - No server maintenance required
- ✅ **Built-in SSL** - Secure connections by default
- ✅ **Automatic Backups** - Point-in-time recovery
- ✅ **Real-time Subscriptions** - Can be used for future features
- ✅ **Free Tier Available** - Perfect for development and small deployments
- ✅ **Scalable** - Grows with your needs
- ✅ **Dashboard Access** - Visual database management

## Step-by-Step Setup

### 1. Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up using GitHub, Google, or Email

### 2. Create a New Project

1. Click "New Project" in your Supabase dashboard
2. Fill in the project details:
   - **Name**: `quartermaster-inventory` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your users
   - **Pricing Plan**: Select based on your needs (Free tier works for testing)
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be provisioned

### 3. Get Your Database Connection String

1. In your Supabase project dashboard, go to **Settings** (⚙️ icon in sidebar)
2. Navigate to **Database** section
3. Scroll down to **Connection string**
4. Select **URI** tab (not the default "Session mode")
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual database password

### 4. Configure Your Application

1. In your project root, copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your Supabase connection string:
   ```env
   # Supabase Configuration
   DATABASE_URL=postgresql://postgres:your_actual_password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=24h
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # File Upload Configuration
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=5242880
   
   # Session Configuration
   SESSION_TIMEOUT=1800000
   ```

3. **Important**: Generate a strong JWT secret:
   ```bash
   # On Linux/Mac:
   openssl rand -base64 32
   
   # On Windows (PowerShell):
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

### 5. Run Database Migrations

Run the migration script to create all necessary tables, triggers, and initial data:

```bash
npm run db:migrate
```

You should see:
```
Running database migrations on Supabase...
✅ Database migration completed successfully
```

### 6. Seed Initial Data

Create the default admin user and sample data:

```bash
npm run db:seed
```

You should see:
```
Seeding Supabase database with initial data...
✅ Database seeded successfully
Default credentials:
Username: admin
Password: Admin@123
⚠️  Please change the password after first login
```

### 7. Start the Application

```bash
npm run dev
```

The application should start and connect to Supabase:
```
✅ New client connected to Supabase
🚀 Server running on port 5000
📝 Environment: development
```

## Verifying the Setup

### Using Supabase Dashboard

1. In your Supabase project, go to **Table Editor** (table icon in sidebar)
2. You should see all the created tables:
   - `users`
   - `items_master`
   - `stock_receipts`
   - `receipt_items`
   - `documents`
   - `audit_logs`
   - `approval_workflow`

3. Click on the `users` table - you should see the admin user

### Using SQL Editor

1. Go to **SQL Editor** in Supabase dashboard
2. Run a test query:
   ```sql
   SELECT username, full_name, role FROM users;
   ```
3. You should see the admin user details

## Production Deployment

### Environment Variables

For production deployment, update your `.env` or hosting platform environment variables:

```env
NODE_ENV=production
DATABASE_URL=your_supabase_connection_string
JWT_SECRET=your_production_jwt_secret
PORT=5000
FRONTEND_URL=https://yourdomain.com
```

### Security Checklist

- ✅ Use a strong, unique JWT_SECRET
- ✅ Change the default admin password immediately
- ✅ Enable Row Level Security (RLS) in Supabase if needed
- ✅ Set up proper CORS origins in production
- ✅ Enable Supabase's built-in security features
- ✅ Regular backups (Supabase does this automatically)
- ✅ Monitor database connection limits

### Supabase Project Settings

Recommended settings for production:

1. **Database → Connection Pooling**: Enable for better performance
2. **Database → Connection Limit**: Adjust based on your expected load
3. **API → JWT Settings**: Keep your JWT secret secure
4. **Storage**: Configure if you plan to move file uploads to Supabase Storage

## Advanced Configuration

### Using Supabase Storage for File Uploads

Instead of local file storage, you can use Supabase Storage:

1. Create a storage bucket in Supabase
2. Update the file upload logic to use Supabase Storage API
3. This allows distributed deployments without shared file systems

### Connection Pooling

For high-traffic applications, use Supabase's connection pooler:

```env
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:6543/postgres?pgbouncer=true
```

Note: Use port 6543 instead of 5432 for connection pooling.

### Read Replicas

For read-heavy workloads, Supabase Pro plans support read replicas. Configure separate connection strings for read and write operations.

## Monitoring and Maintenance

### Supabase Dashboard

Monitor your database through the Supabase dashboard:

- **Database → Usage**: Track database size and connections
- **Logs**: View real-time database logs
- **Reports**: Analyze query performance

### Database Backups

Supabase automatically backs up your database daily. To restore:

1. Go to **Database → Backups**
2. Select a backup point
3. Click "Restore"

### Performance Optimization

1. **Indexes**: Already created by schema.sql
2. **Query Analysis**: Use Supabase's query performance tools
3. **Connection Pool**: Monitor and adjust pool size if needed

## Troubleshooting

### Connection Errors

**Error**: `connect ETIMEDOUT`
- **Solution**: Check your DATABASE_URL is correct
- Ensure your IP is not blocked (Supabase allows all IPs by default)

**Error**: `password authentication failed`
- **Solution**: Verify your database password in the connection string

**Error**: `SSL SYSCALL error`
- **Solution**: The application automatically handles SSL for Supabase

### Migration Issues

**Error**: `relation "users" already exists`
- **Solution**: Database already migrated. Use Supabase SQL Editor to drop tables if you need a fresh start

**Error**: `permission denied for schema public`
- **Solution**: Ensure you're using the postgres user connection string

### Common Issues

1. **Migrations not running**: Ensure `.env` file exists with DATABASE_URL
2. **Connection timeouts**: Check your internet connection and Supabase project status
3. **Performance issues**: Monitor connection pool usage and consider upgrading your Supabase plan

## Migrating from Local PostgreSQL to Supabase

If you're moving from a local PostgreSQL database:

1. **Export your data**:
   ```bash
   pg_dump -U postgres -d quartermaster_db > backup.sql
   ```

2. **Import to Supabase** using the SQL Editor:
   - Split backup.sql into smaller chunks if needed
   - Run in Supabase SQL Editor
   - Or use command line with Supabase connection string

3. **Update .env**:
   ```env
   DATABASE_URL=your_supabase_connection_string
   ```

4. **Test the connection**:
   ```bash
   npm start
   ```

## Support and Resources

- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Community Discord**: Join the Supabase Discord for help
- **Project Issues**: Check the repository issues for known problems

## Cost Considerations

### Free Tier Limits (as of 2024)
- 500 MB database space
- 1 GB file storage
- 2 GB bandwidth
- 50,000 monthly active users
- 7-day log retention

### Paid Plans
Consider upgrading if you need:
- More database space (> 500 MB)
- Daily backups with point-in-time recovery
- Production-grade support
- Custom domains
- Advanced security features

## Next Steps

After successful setup:

1. ✅ Change the default admin password
2. ✅ Create user accounts for your team
3. ✅ Test all features thoroughly
4. ✅ Set up monitoring and alerts
5. ✅ Configure regular backups (if on paid plan)
6. ✅ Review Supabase security settings
7. ✅ Deploy your frontend application

---

**Congratulations!** Your Quarter Master Inventory Management System is now running on Supabase. 🎉
