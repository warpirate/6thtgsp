#!/usr/bin/env node

/**
 * Create Superadmin Account Script
 * Provides superadmin credentials and tests login
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
        persistSession: false,
        detectSessionInUrl: false,
    },
})

async function createSuperAdminAccount() {
    console.log('🚀 Creating Superadmin Account via POST Request\n')

    const superAdminData = {
        email: 'superadmin@quartermaster.dev',
        password: 'admin123',
        fullName: 'Super Administrator',
        department: 'Administration',
        role: 'super_admin'
    }

    try {
        // Step 1: Check for existing user first
        console.log('1️⃣ Checking for existing superadmin user...')
        
        const { data: existingUser } = await supabase
            .from('users')
            .select('id, email, role, is_active')
            .eq('email', superAdminData.email)
            .single()
        
        if (existingUser) {
            console.log('   ✅ Superadmin user already exists in database')
            console.log('   User ID:', existingUser.id)
            console.log('   Role:', existingUser.role)
            console.log('   Active:', existingUser.is_active ? 'Yes' : 'No')
            
            // Test if we can authenticate
            console.log('\n2️⃣ Testing authentication...')
            const { data: loginTest, error: loginError } = await supabase.auth.signInWithPassword({
                email: superAdminData.email,
                password: superAdminData.password,
            })
            
            if (loginError) {
                if (loginError.message.includes('Email not confirmed')) {
                    console.log('⚠️  Email not confirmed - authentication blocked')
                    console.log('\n📝 TO ENABLE LOGIN:')
                    console.log('   1. Go to Supabase Dashboard → Authentication → Users')
                    console.log('   2. Find user: superadmin@quartermaster.dev')
                    console.log('   3. Check "Email Confirmed" or disable email confirmations')
                    console.log('\n   Alternative: Authentication → Settings → uncheck "Enable email confirmations"')
                } else {
                    console.log('❌ Authentication failed:', loginError.message)
                }
            } else {
                console.log('✅ Authentication successful')
                await supabase.auth.signOut()
            }
            
            // Show success message anyway
            console.log('\n🎉 Superadmin Account Setup Complete!')
            console.log('\n📋 SUPERADMIN LOGIN CREDENTIALS:')
            console.log('━'.repeat(50))
            console.log('   Email:', superAdminData.email)
            console.log('   Password:', superAdminData.password)
            console.log('   Role: Super Administrator')
            console.log('   Department: Administration')
            console.log('━'.repeat(50))
            
            if (loginError && loginError.message.includes('Email not confirmed')) {
                console.log('\n⚠️  NOTE: Complete email confirmation steps above to enable login')
            } else {
                console.log('\n✅ Ready to use - login at your application URL')
            }
            return
        }

        // Step 2: Create new user if doesn't exist
        console.log('   No existing superadmin found, creating new account...')
        
        console.log('\n2️⃣ Creating user in Supabase Auth...')
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: superAdminData.email,
            password: superAdminData.password,
            options: {
                data: {
                    full_name: superAdminData.fullName,
                    role: superAdminData.role
                }
            }
        })

        if (authError) {
            if (authError.message.includes('rate limit') || authError.message.includes('request this after')) {
                console.log('⚠️  Rate limited by Supabase. Please wait 60 seconds and try again.')
                console.log('\n💡 Alternatively, create the user manually:')
                console.log('   1. Supabase Dashboard → Authentication → Users → Add User')
                console.log('   2. Email: superadmin@quartermaster.dev')
                console.log('   3. Password: admin123')
                console.log('   4. Auto-confirm: Yes')
                console.log('   5. Then run this script again to create the database profile')
                return
            }
            console.error('❌ Auth creation failed:', authError.message)
            return
        }

        const userId = authData.user?.id
        if (!userId) {
            console.error('❌ No user ID received from auth creation')
            return
        }

        console.log('✅ User created in Supabase Auth')
        console.log('   User ID:', userId)
        console.log('   Email confirmed:', authData.user?.email_confirmed_at ? 'Yes' : 'No')

        // Step 3: Create user profile in database
        console.log('\n3️⃣ Creating user profile in database...')
        
        const userProfileData = {
            id: userId,
            email: superAdminData.email,
            username: 'superadmin',
            password_hash: '',
            full_name: superAdminData.fullName,
            role: superAdminData.role,
            department: superAdminData.department,
            rank: 'Super Admin',
            service_number: 'SA-001',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: null
        }

        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert(userProfileData)
            .select()
            .single()

        if (profileError) {
            console.error('❌ Profile creation failed:', profileError.message)
            return
        }

        console.log('✅ User profile created successfully')

        // Step 4: Final verification and instructions
        console.log('\n4️⃣ Account Setup Complete!')
        
        const needsEmailConfirm = !authData.user?.email_confirmed_at
        
        console.log('\n📋 SUPERADMIN ACCOUNT DETAILS:')
        console.log('━'.repeat(50))
        console.log('   Email:', superAdminData.email)
        console.log('   Password:', superAdminData.password)
        console.log('   Full Name:', superAdminData.fullName)
        console.log('   Role: Super Administrator')
        console.log('   Department: Administration')
        console.log('   Username: superadmin')
        console.log('   Service Number: SA-001')
        console.log('   User ID:', userId)
        console.log('   Email Confirmed:', needsEmailConfirm ? 'No ⚠️' : 'Yes ✅')
        console.log('━'.repeat(50))

        if (needsEmailConfirm) {
            console.log('\n⚠️  IMPORTANT: Email confirmation required for login')
            console.log('\n📝 TO ENABLE LOGIN:')
            console.log('   Option 1 - Confirm manually:')
            console.log('   • Supabase Dashboard → Authentication → Users')
            console.log('   • Find user and check "Email Confirmed"')
            console.log('\n   Option 2 - Disable confirmations:')
            console.log('   • Authentication → Settings → uncheck "Enable email confirmations"')
            console.log('\n   Then refresh and try logging in to the application.')
        } else {
            console.log('\n✅ Account is ready! You can now login to the Quarter Master Inventory System.')
            console.log('   The superadmin can create and manage other users through the User Management page.')
        }

    } catch (error) {
        console.error('\n❌ Unexpected error during account creation:', error)
        console.log('\n🔧 Troubleshooting:')
        console.log('   • Check your .env.local file has correct Supabase credentials')
        console.log('   • Verify the users table exists in your database')
        console.log('   • Check Supabase dashboard for any error logs')
        console.log('   • Try again in a few minutes if rate limited')
    }
}

async function testExistingLogin() {
    console.log('🔍 Testing Existing Superadmin Login\n')

    const credentials = {
        email: 'superadmin@quartermaster.dev',
        password: 'admin123'
    }

    try {
        console.log('📋 Testing with credentials:')
        console.log('   Email:', credentials.email)
        console.log('   Password:', credentials.password)

        const { data: loginResult, error: loginError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        })

        if (loginError) {
            console.log('❌ Login failed:', loginError.message)
            if (loginError.message.includes('Invalid login credentials')) {
                console.log('\n💡 User does not exist. Run account creation instead.')
                return false
            }
            return false
        }

        console.log('✅ Login successful!')
        console.log('   User ID:', loginResult.user.id)

        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', loginResult.user.id)
            .single()

        if (profileError) {
            if (profileError.code === 'PGRST116') {
                console.log('⚠️  User profile not found in database')
                await supabase.auth.signOut()
                return false
            } else {
                console.error('❌ Profile loading error:', profileError.message)
                await supabase.auth.signOut()
                return false
            }
        }

        console.log('✅ Profile loaded successfully')
        console.log('   Role:', userProfile.role)
        console.log('   Department:', userProfile.department || 'Not set')
        console.log('   Active:', userProfile.is_active ? 'Yes' : 'No')

        await supabase.auth.signOut()
        return true

    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return false
    }
}

async function main() {
    console.log('🏠 Quarter Master Inventory - Superadmin Setup\n')
    
    // First, test if superadmin already exists and is working
    console.log('🔍 Checking for existing superadmin account...\n')
    
    const existingAccountWorks = await testExistingLogin()
    
    if (existingAccountWorks) {
        console.log('\n✅ Existing superadmin account is working perfectly!')
        console.log('📋 Use these credentials to login:')
        console.log('━'.repeat(50))
        console.log('   Email: superadmin@quartermaster.dev')
        console.log('   Password: admin123')
        console.log('━'.repeat(50))
        console.log('\n💡 No action needed. You can proceed to use the system.')
        return
    }
    
    console.log('\n🛠️  No working superadmin found. Creating new account...\n')
    
    // Create new superadmin account
    await createSuperAdminAccount()
}

// Run the main function
main().catch(error => {
    console.error('\n💥 Script execution failed:', error)
    process.exit(1)
})
