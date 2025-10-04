# Scripts

This directory contains utility scripts for the Quarter Master project.

## seed-users.mjs

Creates demo users in Supabase Auth and syncs with public.users profiles.

### Prerequisites

1. Get your Service Role key from Supabase Dashboard:
   - Go to Project Settings → API
   - Copy the `service_role` key (starts with `eyJ...`)
   - **⚠️ NEVER commit this key to version control**

### Usage

**PowerShell:**
```powershell
# Set environment variables (one-time per session)
$env:SUPABASE_SERVICE_ROLE_KEY='your-service-role-key-here'
$env:VITE_SUPABASE_URL='https://ehjudngdvilwvrukcxle.supabase.co'

# Run the script
npm run seed-users
# OR
node scripts/seed-users.mjs
```

**Bash/Terminal:**
```bash
# Set environment variables
export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key-here'
export VITE_SUPABASE_URL='https://ehjudngdvilwvrukcxle.supabase.co'

# Run the script
npm run seed-users
```

### What it does

1. **Creates Auth users** using Supabase Admin API:
   - semi@quartermaster.dev / demo123 (semi_user)
   - user@quartermaster.dev / demo123 (user)
   - admin@quartermaster.dev / demo123 (admin)
   - super@quartermaster.dev / demo123 (super_admin)

2. **Confirms emails** automatically (no verification needed)

3. **Syncs public.users** with proper roles and metadata

4. **Ensures storage bucket** `receipt-documents` exists

### After running

You can immediately sign in with any demo account:
- Email: semi@quartermaster.dev, Password: demo123
- Email: user@quartermaster.dev, Password: demo123
- Email: admin@quartermaster.dev, Password: demo123
- Email: super@quartermaster.dev, Password: demo123

### Troubleshooting

- **Missing env vars**: Script will show clear error with instructions
- **Invalid service key**: Check you copied the `service_role` key (not `anon` key)
- **Network errors**: Ensure your IP is allowed in Supabase settings
- **Already exists**: Script handles existing users gracefully (updates metadata)

### Security Notes

- Service Role key has admin privileges - keep it secure
- Only use for development/seeding - never in production client code
- Consider using environment-specific keys for different stages
