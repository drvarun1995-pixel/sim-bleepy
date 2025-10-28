// Simple script to check certificates table structure
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCertificatesStructure() {
  try {
    console.log('🔍 Checking certificates table structure...')
    
    // Get table structure
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'certificates' })
    
    if (columnsError) {
      console.error('Error getting table structure:', columnsError)
      return
    }
    
    console.log('📋 Certificates table columns:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Check for existing certificates
    const { data: certs, error: certsError } = await supabase
      .from('certificates')
      .select('*')
      .limit(5)
    
    if (certsError) {
      console.error('Error fetching certificates:', certsError)
      return
    }
    
    console.log(`\n📊 Found ${certs.length} certificates in database`)
    if (certs.length > 0) {
      console.log('🔍 Sample certificate structure:')
      console.log(JSON.stringify(certs[0], null, 2))
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the check
checkCertificatesStructure()
