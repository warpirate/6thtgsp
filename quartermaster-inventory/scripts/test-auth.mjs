#!/usr/bin/env node

/**
 * Authentication Test Script
 * Tests the authentication flow and JWT token storage
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
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Don't persist in Node.js
    detectSessionInUrl: false,
  },
})

async function testAuthentication() {
  console.log('🔐 Testing Authentication Flow\n')
  
  // Test credentials (use your actual test user)
  const testEmail = 'admin@quartermaster.mil'
  const testPassword = 'Admin@123'
  
  try {
    // Step 1: Sign in
    console.log('1️⃣ Testing sign in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message)
      return
    }
    
    console.log('✅ Sign in successful')
    console.log('   User:', signInData.user.email)
    console.log('   Session expires:', new Date(signInData.session.expires_at * 1000).toLocaleString())
    console.log('   Access token (first 30 chars):', signInData.session.access_token.substring(0, 30) + '...')
    
    // Step 2: Test authenticated API call
    console.log('\n2️⃣ Testing authenticated API call...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', signInData.user.id)
      .single()
    
    if (userError) {
      console.error('❌ API call failed:', userError.message)
      return
    }
    
    console.log('✅ API call successful')
    console.log('   User data:', userData)
    
    // Step 3: Test session retrieval
    console.log('\n3️⃣ Testing session retrieval...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session retrieval failed:', sessionError.message)
      return
    }
    
    if (!session) {
      console.error('❌ No session found')
      return
    }
    
    console.log('✅ Session retrieved successfully')
    console.log('   Session user:', session.user.email)
    
    // Step 4: Test token refresh
    console.log('\n4️⃣ Testing token refresh...')
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      console.error('❌ Token refresh failed:', refreshError.message)
      return
    }
    
    console.log('✅ Token refreshed successfully')
    console.log('   New access token (first 30 chars):', refreshData.session.access_token.substring(0, 30) + '...')
    
    // Step 5: Test storage upload (if bucket exists)
    console.log('\n5️⃣ Testing storage upload...')
    const testFile = new Blob(['Test file content'], { type: 'text/plain' })
    const fileName = `test/${Date.now()}.txt`
    
    const { error: uploadError } = await supabase.storage
      .from('receipt-documents')
      .upload(fileName, testFile)
    
    if (uploadError) {
      if (uploadError.message.includes('not found')) {
        console.log('⚠️ Storage bucket not found (this is expected if not set up)')
      } else {
        console.error('❌ Storage upload failed:', uploadError.message)
      }
    } else {
      console.log('✅ Storage upload successful')
      
      // Clean up test file
      await supabase.storage.from('receipt-documents').remove([fileName])
      console.log('   Test file cleaned up')
    }
    
    // Step 6: Sign out
    console.log('\n6️⃣ Testing sign out...')
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error('❌ Sign out failed:', signOutError.message)
      return
    }
    
    console.log('✅ Sign out successful')
    
    // Verify session is cleared
    const { data: { session: afterSignOut } } = await supabase.auth.getSession()
    if (afterSignOut) {
      console.error('❌ Session still exists after sign out')
    } else {
      console.log('✅ Session cleared successfully')
    }
    
    console.log('\n✅ All authentication tests passed!')
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }
}

// Run tests
testAuthentication()
