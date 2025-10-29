const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runCheckScript() {
  try {
    console.log('🔍 Running check script...')
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: fs.readFileSync('check-feedback-templates.sql', 'utf8')
    })
    
    if (error) {
      console.error('❌ Error running check script:', error)
      return
    }
    
    console.log('✅ Check script completed')
    console.log('📊 Results:', data)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

async function runDeleteScript() {
  try {
    console.log('🗑️ Running delete script...')
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: fs.readFileSync('delete-feedback-templates.sql', 'utf8')
    })
    
    if (error) {
      console.error('❌ Error running delete script:', error)
      return
    }
    
    console.log('✅ Delete script completed')
    console.log('📊 Results:', data)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run both scripts
async function main() {
  console.log('🚀 Starting feedback template cleanup...')
  
  await runCheckScript()
  console.log('\n' + '='.repeat(50) + '\n')
  await runDeleteScript()
  
  console.log('\n🎉 Script execution completed!')
}

main()
