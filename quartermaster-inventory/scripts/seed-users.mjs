#!/usr/bin/env node

/**
 * Seed Demo Users Script
 * 
 * Creates demo users in Supabase Auth using the Admin API and syncs with public.users
 * 
 * Usage:
 *   $env:SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'
 *   $env:VITE_SUPABASE_URL='https://ehjudngdvilwvrukcxle.supabase.co'
 *   node scripts/seed-users.mjs
 */

import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   VITE_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('Set them and try again:')
  console.error('   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"')
  console.error('   $env:VITE_SUPABASE_URL="https://ehjudngdvilwvrukcxle.supabase.co"')
  console.error('   node scripts/seed-users.mjs')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Demo users configuration
const demoUsers = [
  {
    email: 'semi@quartermaster.dev',
    password: 'demo123',
    username: 'semi',
    full_name: 'Semi User',
    role: 'semi_user',
    rank: 'Private',
    service_number: 'SU001'
  },
  {
    email: 'user@quartermaster.dev',
    password: 'demo123',
    username: 'user',
    full_name: 'Standard User',
    role: 'user',
    rank: 'Corporal',
    service_number: 'US001'
  },
  {
    email: 'admin@quartermaster.dev',
    password: 'demo123',
    username: 'admin',
    full_name: 'Admin User',
    role: 'admin',
    rank: 'Sergeant',
    service_number: 'AD001'
  },
  {
    email: 'super@quartermaster.dev',
    password: 'demo123',
    username: 'super',
    full_name: 'Super Admin',
    role: 'super_admin',
    rank: 'Lieutenant',
    service_number: 'SA001'
  }
]

async function createOrUpdateUser(userConfig) {
  const { email, password, username, full_name, role, rank, service_number } = userConfig
  
  console.log(`🔄 Processing ${email}...`)
  
  try {
    // Check if user already exists in auth
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`)
    }
    
    const existingUser = existingUsers.users.find(u => u.email === email)
    let authUserId
    
    if (existingUser) {
      console.log(`   ✓ Auth user exists: ${existingUser.id}`)
      authUserId = existingUser.id
      
      // Update user metadata if needed
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUserId,
        {
          user_metadata: {
            username,
            full_name,
            role,
            rank,
            service_number
          }
        }
      )
      
      if (updateError) {
        console.warn(`   ⚠️  Failed to update user metadata: ${updateError.message}`)
      }
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          full_name,
          role,
          rank,
          service_number
        }
      })
      
      if (createError) {
        throw new Error(`Failed to create auth user: ${createError.message}`)
      }
      
      authUserId = newUser.user.id
      console.log(`   ✓ Created auth user: ${authUserId}`)
    }
    
    // Upsert public.users profile
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: authUserId,
        username,
        password_hash: 'managed_by_auth', // Placeholder since auth handles passwords
        full_name,
        role,
        rank,
        service_number,
        email,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
    
    if (upsertError) {
      throw new Error(`Failed to upsert public profile: ${upsertError.message}`)
    }
    
    console.log(`   ✓ Synced public profile`)
    console.log(`   ✅ ${email} ready (password: ${password})`)
    
  } catch (error) {
    console.error(`   ❌ Failed to process ${email}: ${error.message}`)
    return false
  }
  
  return true
}

async function ensureStorageBucket() {
  console.log('🔄 Ensuring storage bucket exists...')
  
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }
    
    const bucketExists = buckets.some(bucket => bucket.id === 'receipt-documents')
    
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket('receipt-documents', {
        public: true,
        allowedMimeTypes: ['image/*', 'application/pdf', 'text/*'],
        fileSizeLimit: 5242880 // 5MB
      })
      
      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`)
      }
      
      console.log('   ✓ Created receipt-documents bucket')
    } else {
      console.log('   ✓ Bucket already exists')
    }
    
  } catch (error) {
    console.error(`   ❌ Storage bucket error: ${error.message}`)
    return false
  }
  
  return true
}

async function main() {
  console.log('🚀 Starting demo user seeding...')
  console.log(`📡 Supabase URL: ${supabaseUrl}`)
  console.log('')
  
  let successCount = 0
  
  // Process each demo user
  for (const userConfig of demoUsers) {
    const success = await createOrUpdateUser(userConfig)
    if (success) successCount++
    console.log('')
  }
  
  // Ensure storage bucket
  await ensureStorageBucket()
  console.log('')
  
  // Summary
  console.log('📊 Summary:')
  console.log(`   ✅ ${successCount}/${demoUsers.length} users processed successfully`)
  
  if (successCount === demoUsers.length) {
    console.log('')
    console.log('🎉 All demo users are ready!')
    console.log('   You can now sign in with any of these accounts:')
    console.log('')
    demoUsers.forEach(user => {
      console.log(`   📧 ${user.email}`)
      console.log(`   🔑 ${user.password}`)
      console.log(`   👤 ${user.role}`)
      console.log('')
    })
    console.log('🌐 Start your dev server: npm run dev')
    console.log('🔗 Open: http://localhost:5173')
  } else {
    console.log('')
    console.log('⚠️  Some users failed to process. Check the errors above.')
    process.exit(1)
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error.message)
  process.exit(1)
})
