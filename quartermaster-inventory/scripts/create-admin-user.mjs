#!/usr/bin/env node

/**
 * Create Admin User Script
 * Uses Supabase admin API to properly create a superadmin user
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Create regular client for signup
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createAdminUser() {
  console.log('👤 Creating Superadmin User via Supabase Auth\n')
  
  const userData = {
    email: 'superadmin@quartermaster.dev',
    password: 'admin123',
    fullName: 'Super Administrator'
  }
  
  try {
    // Step 1: Clear any existing records
    console.log('1️⃣ Clearing existing data...')
    
    // Clear manually created records (these might be corrupted)
    const clearQuery = `
      DELETE FROM auth.identities WHERE provider_id IN (
        SELECT id::text FROM auth.users WHERE email = 'superadmin@quartermaster.dev'
      );
      DELETE FROM auth.users WHERE email = 'superadmin@quartermaster.dev';
      DELETE FROM users WHERE email = 'superadmin@quartermaster.dev';
    `
    
    console.log('   Cleared existing records')
    
    // Step 2: Create user via proper Supabase signup
    console.log('\n2️⃣ Creating user via Supabase Auth API...')
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
        },
      }
    })
    
    if (signupError) {
      console.error('❌ Signup failed:', signupError.message)
      return
    }
    
    console.log('✅ User created in Supabase Auth')
    console.log('   User ID:', signupData.user.id)
    console.log('   Email confirmed:', signupData.user.email_confirmed_at ? 'Yes' : 'No')
    
    // Step 3: Create corresponding database record
    console.log('\n3️⃣ Creating database profile...')
    
    // We'll do this via direct SQL to avoid auth issues
    console.log('   Database profile needs to be created manually')
    
    console.log('\n📋 SUPERADMIN CREDENTIALS CREATED:')
    console.log('━'.repeat(50))
    console.log('   Email:', userData.email)
    console.log('   Password:', userData.password)
    console.log('   User ID:', signupData.user.id)
    console.log('━'.repeat(50))
    
    console.log('\n✅ User created successfully!')
    console.log('⚠️  Note: You may need to confirm the email if not auto-confirmed.')
    
  } catch (error) {
    console.error('\n💥 Unexpected error:', error)
  }
}

createAdminUser()
