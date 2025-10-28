// Test certificate upload with the same path structure
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCertificateUpload() {
  try {
    console.log('🔍 Testing certificate upload with same path structure...')
    
    // Create a test certificate file with the same path structure
    const testContent = 'This is a test certificate file'
    const testBlob = new Blob([testContent], { type: 'image/png' })
    const testPath = 'users/Dr__Varun/certificates/demo_event/Dr__Varun/demo_event_test.png'
    
    console.log('📤 Uploading test file to:', testPath)
    console.log('📤 Blob size:', testBlob.size)
    console.log('📤 Blob type:', testBlob.type)
    
    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(testPath, testBlob, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('❌ Upload error:', error)
      console.error('❌ Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        error: error.error
      })
    } else {
      console.log('✅ Upload successful:', data)
      
      // Try to list the files in the directory
      console.log('🔍 Listing files in users/Dr__Varun/certificates/demo_event/Dr__Varun/...')
      const { data: files, error: listError } = await supabase.storage
        .from('certificates')
        .list('users/Dr__Varun/certificates/demo_event/Dr__Varun')
      
      if (listError) {
        console.error('❌ List error:', listError)
      } else {
        console.log('📁 Files in directory:', files)
      }
      
      // Clean up
      console.log('🗑️ Cleaning up test file...')
      const { error: deleteError } = await supabase.storage
        .from('certificates')
        .remove([testPath])
      
      if (deleteError) {
        console.error('❌ Delete error:', deleteError)
      } else {
        console.log('✅ Test file cleaned up')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the test
testCertificateUpload()
