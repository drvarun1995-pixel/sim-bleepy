import { createClient } from '@supabase/supabase-js'

// This script helps set up an admin user for testing
// Run with: npx tsx scripts/setup-admin-user.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupAdminUser() {
  try {
    console.log('Setting up admin user...')

    // Check if admin user already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@simbleepy.com')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing admin:', checkError)
      return
    }

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin)
      
      // Update role to admin if not already
      if (existingAdmin.role !== 'admin') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('email', 'admin@simbleepy.com')

        if (updateError) {
          console.error('Error updating admin role:', updateError)
        } else {
          console.log('Updated existing user to admin role')
        }
      }
      return
    }

    // Create admin user
    const { data: newAdmin, error: insertError } = await supabase
      .from('profiles')
      .insert({
        email: 'admin@simbleepy.com',
        role: 'admin',
        org: 'default',
        full_name: 'System Administrator'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating admin user:', insertError)
      return
    }

    console.log('Admin user created successfully:', newAdmin)
    console.log('You can now log in with email: admin@simbleepy.com')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Also create a function to set any user as admin by email
async function setUserAsAdmin(email: string) {
  try {
    console.log(`Setting ${email} as admin...`)

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        email,
        role: 'admin',
        org: 'default',
        full_name: 'Administrator'
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (error) {
      console.error('Error setting user as admin:', error)
      return
    }

    console.log('User set as admin successfully:', data)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the setup
if (process.argv.length > 2) {
  const email = process.argv[2]
  setUserAsAdmin(email)
} else {
  setupAdminUser()
}
