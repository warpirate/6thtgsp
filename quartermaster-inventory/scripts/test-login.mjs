#!/usr/bin/env node

/**
 * Test login with demo users
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ehjudngdvilwvrukcxle.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoanVkbmdkdmlsd3ZydWtjeGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTA4NTksImV4cCI6MjA3NTEyNjg1OX0.ScklULAdDk2np6TSzLwSrISeT2k_ZeymyNr504w4iTk'

const supabase = createClient(supabaseUrl, anonKey)

async function testLogin(email, password) {
  console.log(`🔐 Testing login: ${email}`)
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error(`   ❌ Login failed: ${error.message}`)
      return false
    }
    
    if (data.user) {
      console.log(`   ✅ Login successful!`)
      console.log(`   👤 User ID: ${data.user.id}`)
      console.log(`   📧 Email: ${data.user.email}`)
      
      // Test getting user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('username, full_name, role')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        console.warn(`   ⚠️  Profile fetch failed: ${profileError.message}`)
      } else {
        console.log(`   👤 Profile: ${profile.full_name} (${profile.role})`)
      }
      
      // Sign out
      await supabase.auth.signOut()
      return true
    }
    
  } catch (error) {
    console.error(`   💥 Error: ${error.message}`)
    return false
  }
  
  return false
}

async function main() {
  console.log('🧪 Testing demo user logins...\n')
  
  const testUsers = [
    { email: 'user@quartermaster.dev', password: 'demo123' },
    { email: 'admin@quartermaster.dev', password: 'demo123' },
    { email: 'semi@quartermaster.dev', password: 'demo123' },
    { email: 'super@quartermaster.dev', password: 'demo123' }
  ]
  
  let successCount = 0
  
  for (const user of testUsers) {
    const success = await testLogin(user.email, user.password)
    if (success) successCount++
    console.log('')
  }
  
  console.log(`📊 Results: ${successCount}/${testUsers.length} logins successful`)
  
  if (successCount === testUsers.length) {
    console.log('\n🎉 All demo users can log in!')
    console.log('🌐 Try logging in at: http://localhost:5173')
  } else {
    console.log('\n❌ Some logins failed. Check the errors above.')
  }
}

main().catch(console.error)
