#!/usr/bin/env node

/**
 * Debug Login Script
 * Tests login with detailed error reporting
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

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

async function debugLogin() {
  console.log('🔍 Debugging Login Process\n')
  
  const credentials = {
    email: 'superadmin@quartermaster.dev',
    password: 'admin123'
  }
  
  try {
    console.log('Step 1: Testing basic login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword(credentials)
    
    if (loginError) {
      console.error('❌ Login failed:', loginError)
      console.error('Error code:', loginError.status)
      console.error('Error message:', loginError.message)
      return
    }
    
    console.log('✅ Login successful!')
    console.log('User ID:', loginData.user.id)
    console.log('Email:', loginData.user.email)
    
    console.log('\nStep 2: Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
    
    if (testError) {
      console.error('❌ Database connection failed:', testError)
      return
    }
    
    console.log('✅ Database connection successful')
    
    console.log('\nStep 3: Testing user profile query...')
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active')
      .eq('id', loginData.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile query failed:', profileError)
      console.error('Error code:', profileError.code)
      console.error('Error message:', profileError.message)
      console.error('Error details:', profileError.details)
      return
    }
    
    console.log('✅ Profile query successful!')
    console.log('Profile:', profile)
    
    console.log('\nStep 4: Testing full profile query...')
    const { data: fullProfile, error: fullProfileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single()
    
    if (fullProfileError) {
      console.error('❌ Full profile query failed:', fullProfileError)
      console.error('Error code:', fullProfileError.code)
      console.error('Error message:', fullProfileError.message)
      return
    }
    
    console.log('✅ Full profile query successful!')
    console.log('Full profile:', fullProfile)
    
    // Sign out
    await supabase.auth.signOut()
    console.log('\n🎉 All tests passed! Login should work.')
    
  } catch (error) {
    console.error('\n💥 Unexpected error:', error)
  }
}

debugLogin()
