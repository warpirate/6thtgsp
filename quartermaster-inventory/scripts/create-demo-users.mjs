#!/usr/bin/env node

/**
 * Create demo users using sign up (which properly creates auth entries)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ehjudngdvilwvrukcxle.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoanVkbmdkdmlsd3ZydWtjeGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTA4NTksImV4cCI6MjA3NTEyNjg1OX0.ScklULAdDk2np6TSzLwSrISeT2k_ZeymyNr504w4iTk'

const supabase = createClient(supabaseUrl, anonKey)

const demoUsers = [
  {
    email: 'semi@quartermaster.dev',
    password: 'demo123',
    username: 'semi',
    full_name: 'Semi User',
    role: 'semi_user'
  },
  {
    email: 'user@quartermaster.dev', 
    password: 'demo123',
    username: 'user',
    full_name: 'Standard User',
    role: 'user'
  },
  {
    email: 'admin@quartermaster.dev',
    password: 'demo123', 
    username: 'admin',
    full_name: 'Admin User',
    role: 'admin'
  },
  {
    email: 'super@quartermaster.dev',
    password: 'demo123',
    username: 'super', 
    full_name: 'Super Admin',
    role: 'super_admin'
  }
]

async function createUser(userConfig) {
  const { email, password, username, full_name, role } = userConfig
  
  console.log(`🔄 Creating ${email}...`)
  
  try {
    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name,
          role
        }
      }
    })
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`   ℹ️  User already exists, trying to sign in...`)
        
        // Try to sign in to verify it works
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (signInError) {
          console.error(`   ❌ Sign in failed: ${signInError.message}`)
          return false
        } else {
          console.log(`   ✅ Sign in successful!`)
          
          // Update public profile
          await updatePublicProfile(signInData.user.id, username, full_name, role, email)
          
          // Sign out
          await supabase.auth.signOut()
          return true
        }
      } else {
        console.error(`   ❌ Sign up failed: ${error.message}`)
        return false
      }
    }
    
    if (data.user) {
      console.log(`   ✅ Auth user created: ${data.user.id}`)
      
      // Create/update public profile
      await updatePublicProfile(data.user.id, username, full_name, role, email)
      
      // Sign out
      await supabase.auth.signOut()
      return true
    }
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    return false
  }
  
  return false
}

async function updatePublicProfile(userId, username, fullName, role, email) {
  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        username,
        password_hash: 'managed_by_auth',
        full_name: fullName,
        role,
        email,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
    
    if (error) {
      console.error(`   ⚠️  Profile update failed: ${error.message}`)
    } else {
      console.log(`   ✅ Profile updated`)
    }
  } catch (error) {
    console.error(`   ⚠️  Profile error: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 Creating demo users...')
  
  let successCount = 0
  
  for (const userConfig of demoUsers) {
    const success = await createUser(userConfig)
    if (success) successCount++
    console.log('')
  }
  
  console.log(`📊 Created ${successCount}/${demoUsers.length} users`)
  
  if (successCount > 0) {
    console.log('\n🎉 Demo users ready! Try logging in with:')
    demoUsers.forEach(user => {
      console.log(`   📧 ${user.email} / 🔑 ${user.password}`)
    })
  }
}

main().catch(console.error)
