#!/usr/bin/env node

/**
 * Quick test to verify Supabase connection and create a test user
 */

import { createClient } from '@supabase/supabase-js'

// Use the same env vars as the frontend
const supabaseUrl = 'https://ehjudngdvilwvrukcxle.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoanVkbmdkdmlsd3ZydWtjeGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTA4NTksImV4cCI6MjA3NTEyNjg1OX0.ScklULAdDk2np6TSzLwSrISeT2k_ZeymyNr504w4iTk'

console.log('🔍 Testing Supabase connection...')
console.log(`📡 URL: ${supabaseUrl}`)

const supabase = createClient(supabaseUrl, anonKey)

async function testConnection() {
  try {
    // Test basic connection
    console.log('\n1️⃣ Testing basic connection...')
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log(`✅ Connected! Found ${data} users in public.users`)
    
    // Test sign up (create a test user)
    console.log('\n2️⃣ Testing user creation...')
    const testEmail = 'test@quartermaster.dev'
    const testPassword = 'demo123'
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          role: 'user'
        }
      }
    })
    
    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError.message)
      
      // Try signing in with existing user
      console.log('\n3️⃣ Testing sign in with existing user...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'user@quartermaster.dev',
        password: 'demo123'
      })
      
      if (signInError) {
        console.error('❌ Sign in failed:', signInError.message)
        console.log('\n💡 This confirms the auth users need to be created properly')
        return false
      } else {
        console.log('✅ Sign in worked! User exists:', signInData.user.email)
        return true
      }
    } else {
      console.log('✅ Sign up worked! Created user:', signUpData.user?.email)
      
      // Now create the public profile
      if (signUpData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: signUpData.user.id,
            username: 'test',
            password_hash: 'managed_by_auth',
            full_name: 'Test User',
            role: 'user',
            email: testEmail,
            is_active: true
          })
        
        if (profileError) {
          console.warn('⚠️ Profile creation failed:', profileError.message)
        } else {
          console.log('✅ Profile created successfully')
        }
      }
      
      return true
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase is working!')
    console.log('💡 You can now create the demo users through the Supabase Dashboard')
    console.log('   or run the seed script with your service role key.')
  } else {
    console.log('\n❌ There are issues with the Supabase setup')
  }
})
