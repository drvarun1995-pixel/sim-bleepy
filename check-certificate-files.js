// Check what certificate files exist in storage
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCertificateFiles() {
  try {
    console.log('🔍 Checking certificate files in storage...')
    
    // List all files in the certificates bucket
    const { data: files, error } = await supabase.storage
      .from('certificates')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    
    if (error) {
      console.error('❌ Error listing files:', error)
      return
    }
    
    console.log(`📁 Found ${files.length} files in certificates bucket:`)
    
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name}`)
      console.log(`     Size: ${file.metadata?.size || 'Unknown'} bytes`)
      console.log(`     Created: ${file.created_at}`)
      console.log(`     Updated: ${file.updated_at}`)
      console.log('')
    })
    
    // Check specifically for the problematic file
    const problematicPath = 'users/Dr__Varun/certificates/demo_event/Dr__Varun/demo_event_27d8dca9-da3d-4bcb-8408-d81025fcae93.png'
    console.log(`🔍 Checking for specific file: ${problematicPath}`)
    
    const { data: specificFile, error: specificError } = await supabase.storage
      .from('certificates')
      .list('users/Dr__Varun/certificates/demo_event/Dr__Varun', {
        search: 'demo_event_27d8dca9-da3d-4bcb-8408-d81025fcae93.png'
      })
    
    if (specificError) {
      console.error('❌ Error checking specific file:', specificError)
    } else if (specificFile && specificFile.length > 0) {
      console.log('✅ Specific file found:', specificFile[0])
    } else {
      console.log('❌ Specific file not found')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the check
checkCertificateFiles()
