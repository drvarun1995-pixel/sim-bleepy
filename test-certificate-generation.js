// Test certificate generation flow
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCertificateGeneration() {
  try {
    console.log('🔍 Testing certificate generation flow...')
    
    // Check for existing certificates for the specific event and user
    const eventId = '2d9e3d0e-6d31-4afe-baa4-5604e817a09b'
    const userId = '02c99dc5-1a2b-4e42-8965-f46ac1f84858'
    
    console.log(`🔍 Checking for existing certificates for event ${eventId} and user ${userId}`)
    
    const { data: existingCerts, error: existingError } = await supabase
      .from('certificates')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
    
    if (existingError) {
      console.error('❌ Error checking existing certificates:', existingError)
      return
    }
    
    console.log(`📊 Found ${existingCerts.length} existing certificates`)
    
    if (existingCerts.length > 0) {
      console.log('🔍 Existing certificates:')
      existingCerts.forEach((cert, index) => {
        console.log(`  ${index + 1}. ID: ${cert.id}`)
        console.log(`     Created: ${cert.created_at}`)
        console.log(`     Generated: ${cert.generated_at}`)
        console.log(`     Filename: ${cert.certificate_filename}`)
        console.log(`     URL: ${cert.certificate_url}`)
        console.log(`     Email sent: ${cert.sent_via_email}`)
        console.log('')
      })
      
      // Test deleting the existing certificates
      console.log('🗑️ Testing certificate deletion...')
      for (const cert of existingCerts) {
        console.log(`🗑️ Deleting certificate ${cert.id}`)
        
        // Delete from storage if filename exists
        if (cert.certificate_filename) {
          try {
            let filePathToDelete = cert.certificate_filename
            
            // If it's just a filename, try to construct the full path
            if (!filePathToDelete.includes('/') && cert.certificate_data) {
              const data = cert.certificate_data
              const generatorName = data.generator_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Generator'
              const eventTitleSlug = data.event_title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Event'
              const recipientNameSlug = data.attendee_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Recipient'
              filePathToDelete = `users/${generatorName}/certificates/${eventTitleSlug}/${recipientNameSlug}/${cert.certificate_filename}`
            }
            
            console.log(`  🗑️ Deleting file: ${filePathToDelete}`)
            const { error: storageError } = await supabase.storage
              .from('certificates')
              .remove([filePathToDelete])
            
            if (storageError) {
              console.error(`  ❌ Error deleting file: ${storageError.message}`)
            } else {
              console.log(`  ✅ Successfully deleted file`)
            }
          } catch (storageError) {
            console.error(`  ❌ Storage error: ${storageError.message}`)
          }
        }
        
        // Delete from database
        const { error: deleteError } = await supabase
          .from('certificates')
          .delete()
          .eq('id', cert.id)
        
        if (deleteError) {
          console.error(`  ❌ Error deleting from database: ${deleteError.message}`)
        } else {
          console.log(`  ✅ Successfully deleted from database`)
        }
      }
    }
    
    console.log('✅ Certificate cleanup test completed')
    
  } catch (error) {
    console.error('❌ Error in test:', error)
  }
}

// Run the test
testCertificateGeneration()
