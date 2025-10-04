# Supabase Migration Checklist

Use this checklist to ensure your Quarter Master Inventory System is properly configured for Supabase.

## ✅ Pre-Migration Checklist

- [ ] Node.js v18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Supabase account created
- [ ] Supabase project created and active
- [ ] Database connection string copied from Supabase

## ✅ Configuration Checklist

- [ ] `.env` file created (from `.env.example`)
- [ ] `DATABASE_URL` set in `.env` with Supabase connection string
- [ ] `JWT_SECRET` set to a strong, random value
- [ ] Other environment variables configured (PORT, NODE_ENV, etc.)
- [ ] `.env` file is in `.gitignore` (security check)

## ✅ Database Setup Checklist

- [ ] Connection test passed: `npm run db:test`
- [ ] Database schema created: `npm run db:migrate`
- [ ] Initial data seeded: `npm run db:seed`
- [ ] Admin user created successfully
- [ ] Sample items visible in database

## ✅ Verification Checklist

### Database Tables
Verify these tables exist in Supabase (Table Editor):
- [ ] `users`
- [ ] `items_master`
- [ ] `stock_receipts`
- [ ] `receipt_items`
- [ ] `documents`
- [ ] `audit_logs`
- [ ] `approval_workflow`

### Database Functions
Verify these functions exist in Supabase (SQL Editor):
- [ ] `update_updated_at_column()`
- [ ] `generate_grn_number()`
- [ ] `log_audit_trail()`

### Database Triggers
Verify these triggers exist:
- [ ] `update_users_updated_at`
- [ ] `update_items_master_updated_at`
- [ ] `update_stock_receipts_updated_at`
- [ ] `generate_grn_number_trigger`
- [ ] `audit_users_trigger`
- [ ] `audit_stock_receipts_trigger`
- [ ] `audit_receipt_items_trigger`
- [ ] `audit_items_master_trigger`

### Extensions
- [ ] `uuid-ossp` extension enabled

## ✅ Application Startup Checklist

- [ ] Backend starts without errors: `npm run server`
- [ ] Frontend starts without errors: `npm run client`
- [ ] Full application runs: `npm run dev`
- [ ] Health check endpoint works: http://localhost:5000/api/health
- [ ] API documentation accessible: http://localhost:5000/api

## ✅ Functionality Testing Checklist

### Authentication
- [ ] Can login with admin credentials (admin / Admin@123)
- [ ] JWT token is generated and stored
- [ ] Protected routes require authentication
- [ ] Logout works correctly
- [ ] Can change password

### User Management (Super Admin)
- [ ] Can view all users
- [ ] Can create new users
- [ ] Can edit user details
- [ ] Can deactivate/activate users
- [ ] Can reset user passwords
- [ ] Role-based permissions work

### Items Master
- [ ] Can view all items
- [ ] Can create new items
- [ ] Can edit items
- [ ] Can search/filter items
- [ ] Item categories work correctly
- [ ] Sample items are visible

### Stock Receipts
- [ ] Can view receipts list
- [ ] Can create new receipt
- [ ] GRN number auto-generates
- [ ] Can add items to receipt
- [ ] Can upload documents
- [ ] Draft status works
- [ ] Submit workflow works
- [ ] Verify workflow works (Admin)
- [ ] Approve workflow works (Super Admin)
- [ ] Reject workflow works

### Reports
- [ ] Receipt register report loads
- [ ] Item history report works
- [ ] Pending approvals report shows data
- [ ] User activity report loads
- [ ] Export functionality works

### Audit Logs
- [ ] Audit logs are created for actions
- [ ] Can view audit logs (Admin+)
- [ ] Receipt audit trail shows workflow
- [ ] Timestamps are correct

## ✅ Security Checklist

- [ ] Default admin password changed
- [ ] JWT_SECRET is strong and unique
- [ ] `.env` file not committed to git
- [ ] File upload restrictions work (PDF, JPG, PNG only)
- [ ] File size limits enforced (5MB max)
- [ ] Rate limiting works on login (5 attempts, 15min lockout)
- [ ] Session timeout works (30 minutes)
- [ ] CORS configured properly
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (input validation)

## ✅ Performance Checklist

- [ ] Database indexes created
- [ ] Connection pooling configured (max 20)
- [ ] Query performance acceptable
- [ ] Page load times reasonable
- [ ] No memory leaks detected

## ✅ Production Readiness Checklist

- [ ] `NODE_ENV` set to `production`
- [ ] Strong `JWT_SECRET` in production
- [ ] Frontend built: `npm run build`
- [ ] Production server tested: `npm start`
- [ ] Environment variables secured
- [ ] Error handling tested
- [ ] Logging configured
- [ ] Backup strategy in place (Supabase handles this)
- [ ] Monitoring setup
- [ ] SSL/HTTPS enabled (Supabase provides this)

## ✅ Supabase Specific Checks

### Dashboard Access
- [ ] Can access Supabase project dashboard
- [ ] Table Editor shows all tables
- [ ] SQL Editor works
- [ ] Database statistics visible

### Supabase Features (Optional)
- [ ] Row Level Security (RLS) configured if needed
- [ ] Realtime enabled if needed
- [ ] Storage configured if using for files
- [ ] API keys secured
- [ ] Project API settings reviewed

### Backup & Recovery
- [ ] Understand Supabase backup policy
- [ ] Know how to restore from backup
- [ ] Point-in-time recovery tested (if on paid plan)

## ✅ Documentation Checklist

- [ ] `README.md` reviewed and understood
- [ ] `QUICKSTART.md` followed successfully
- [ ] `SUPABASE_SETUP.md` used for setup
- [ ] API endpoints documented
- [ ] User roles and permissions documented
- [ ] Team members trained

## ✅ Deployment Checklist

- [ ] Choose hosting platform (Heroku, Railway, Render, etc.)
- [ ] Set environment variables on hosting platform
- [ ] Deploy backend application
- [ ] Deploy frontend application
- [ ] Configure custom domain (optional)
- [ ] Test production deployment
- [ ] Monitor for errors

## 🎯 Final Verification

Run through this complete workflow:

1. **Login as Admin**
   - [ ] Login with admin credentials
   - [ ] Change password immediately

2. **Create Test User**
   - [ ] Create a new user with "user" role
   - [ ] Logout
   - [ ] Login as new user
   - [ ] Verify limited permissions

3. **Create Test Receipt**
   - [ ] Login as user
   - [ ] Create new stock receipt
   - [ ] Add multiple items
   - [ ] Upload a document
   - [ ] Submit for verification

4. **Verify Receipt**
   - [ ] Logout, login as admin
   - [ ] Find pending receipt
   - [ ] Verify the receipt
   - [ ] Add verification comments

5. **Approve Receipt**
   - [ ] Logout, login as super_admin
   - [ ] Find verified receipt
   - [ ] Approve the receipt
   - [ ] Check audit trail

6. **Generate Reports**
   - [ ] Run receipt register report
   - [ ] Check item history
   - [ ] View pending approvals
   - [ ] Export a report

7. **Check Audit Logs**
   - [ ] View system audit logs
   - [ ] Check receipt audit trail
   - [ ] Verify all actions logged

## 📝 Notes & Issues

Use this space to track any issues or custom configurations:

```
Date: _______________
Checked by: _______________

Issues Found:
1. 
2. 
3. 

Resolutions:
1. 
2. 
3. 

Custom Configurations:
1. 
2. 
3. 
```

## ✅ Sign-Off

- [ ] All checklist items completed
- [ ] All tests passed
- [ ] Production ready
- [ ] Team trained
- [ ] Documentation reviewed

**Signed off by:** _______________  
**Date:** _______________  
**Environment:** [ ] Development [ ] Staging [ ] Production

---

## 🆘 Troubleshooting Reference

If you encounter issues, check:

1. **Connection Issues**: Run `npm run db:test`
2. **Migration Issues**: Check Supabase logs in dashboard
3. **Authentication Issues**: Verify JWT_SECRET is set
4. **Permission Issues**: Check user roles in database
5. **Performance Issues**: Review Supabase database usage

**Quick Fix Commands:**
```bash
# Test everything
npm run db:test

# Re-run migrations (careful - may duplicate data)
npm run db:migrate

# Restart application
npm run dev

# Check logs
# View terminal output for errors
```

---

**Migration Complete!** 🎉

Your Quarter Master Inventory System is now running on Supabase!
