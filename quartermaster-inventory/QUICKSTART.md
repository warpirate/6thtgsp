# Quick Start Guide

Get your Quarter Master Inventory Management System up and running in 5 minutes!

## 🚀 Fast Setup

### Step 1: Get Your Supabase Database URL

1. **Create Supabase Account** (if you don't have one)
   - Visit [supabase.com](https://supabase.com)
   - Sign up (it's free!)

2. **Create New Project**
   - Click "New Project"
   - Set a project name and password
   - Choose a region close to you
   - Wait 2-3 minutes for provisioning

3. **Get Connection String**
   - Go to **Settings** → **Database**
   - Scroll to **Connection string**
   - Select **URI** tab
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your actual password

### Step 2: Configure Your Application

1. **Create `.env` file** in the project root:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** and add your Supabase URL:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   JWT_SECRET=change_this_to_a_random_secret_key
   PORT=5000
   NODE_ENV=development
   ```

3. **Generate a secure JWT secret** (optional but recommended):
   ```bash
   # Windows PowerShell:
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

### Step 3: Setup Database

Run these commands in your project root:

```bash
# Test database connection
npm run db:test

# Create database schema (tables, triggers, etc.)
npm run db:migrate

# Add initial admin user and sample data
npm run db:seed
```

### Step 4: Start the Application

```bash
# Start both backend and frontend
npm run dev
```

You should see:
```
✅ New client connected to Supabase
🚀 Server running on port 5000
📝 Environment: development
```

### Step 5: Access the Application

1. **Frontend**: http://localhost:5173 (or whatever port Vite shows)
2. **Backend API**: http://localhost:5000/api
3. **Health Check**: http://localhost:5000/api/health

**Default Login Credentials:**
- Username: `admin`
- Password: `Admin@123`

⚠️ **Important**: Change the admin password after first login!

---

## 🔧 Troubleshooting

### Connection Issues

**Problem**: `ECONNREFUSED` or connection timeout

**Solution**:
```bash
# 1. Test your connection
npm run db:test

# 2. Verify your .env file
# Make sure DATABASE_URL is set correctly

# 3. Check Supabase project status
# Go to your Supabase dashboard and ensure project is active
```

### Migration Issues

**Problem**: Tables not created or errors during migration

**Solution**:
```bash
# Check if .env file exists
ls .env

# Verify DATABASE_URL is set
npm run db:test

# Try migration again
npm run db:migrate
```

### Port Already in Use

**Problem**: `EADDRINUSE: address already in use`

**Solution**:
```bash
# Change PORT in .env file
# For example: PORT=5001

# Or kill the process using the port (Windows):
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## 📋 Common Commands

```bash
# Development
npm run dev                  # Start full application (backend + frontend)
npm run server              # Start backend only
npm run client              # Start frontend only

# Database
npm run db:test             # Test database connection
npm run db:migrate          # Run migrations (create schema)
npm run db:seed             # Seed initial data

# Production
npm run build               # Build frontend for production
npm start                   # Start production server
```

---

## 🎯 Next Steps

After successful setup:

1. ✅ **Change Admin Password**
   - Login with default credentials
   - Go to profile/settings
   - Change password

2. ✅ **Create User Accounts**
   - Login as admin
   - Navigate to Users section
   - Add users for your team

3. ✅ **Add Inventory Items**
   - Go to Items Master
   - Add your organization's items
   - Categorize properly

4. ✅ **Start Recording Receipts**
   - Create stock receipts
   - Follow the approval workflow
   - Upload supporting documents

5. ✅ **Explore Reports**
   - Check receipt registers
   - View pending approvals
   - Monitor user activity

---

## 📚 More Information

- **Full Documentation**: See `README.md`
- **Supabase Setup**: See `SUPABASE_SETUP.md`
- **API Documentation**: Visit http://localhost:5000/api

---

## ✨ Tips

### Using Local PostgreSQL Instead

If you prefer local PostgreSQL over Supabase:

1. **Install PostgreSQL** (v14+)

2. **Create Database**:
   ```sql
   CREATE DATABASE quartermaster_db;
   ```

3. **Update `.env`**:
   ```env
   # Comment out DATABASE_URL
   # DATABASE_URL=...

   # Use individual settings
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=quartermaster_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

4. **Run migrations and seed**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

### Switching Between Databases

To switch between Supabase and local PostgreSQL, simply update your `.env`:

- **For Supabase**: Set `DATABASE_URL`
- **For Local**: Comment out `DATABASE_URL` and set `DB_*` variables

The application auto-detects which to use!

---

**Need Help?** Check the troubleshooting section in `README.md` or `SUPABASE_SETUP.md`

Happy Inventory Management! 🎉
