// Script to clean up duplicate certificates
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupDuplicateCertificates() {
  try {
    console.log('🔍 Checking for duplicate certificates...')
    
    // Get all certificates and find duplicates manually
    const { data: allCerts, error: allCertsError } = await supabase
      .from('certificates')
      .select('id, event_id, user_id, generated_at, certificate_filename, certificate_data')
      .order('generated_at', { ascending: false })
    
    if (allCertsError) {
      console.error('Error fetching certificates:', allCertsError)
      return
    }
    
    // Group by event_id + user_id to find duplicates
    const groupedCerts = {}
    allCerts.forEach(cert => {
      const key = `${cert.event_id}-${cert.user_id}`
      if (!groupedCerts[key]) {
        groupedCerts[key] = []
      }
      groupedCerts[key].push(cert)
    })
    
    // Find groups with more than one certificate
    const duplicates = Object.values(groupedCerts).filter(group => group.length > 1)
    
    if (!duplicates || duplicates.length === 0) {
      console.log('✅ No duplicate certificates found')
      return
    }
    
    console.log(`🔍 Found ${duplicates.length} duplicate certificate groups`)
    
    for (const certGroup of duplicates) {
      const firstCert = certGroup[0]
      console.log(`\n🗑️ Cleaning up duplicates for event ${firstCert.event_id}, user ${firstCert.user_id}`)
      
      if (certGroup.length <= 1) {
        console.log('  ✅ Only one certificate found, skipping')
        continue
      }
      
      // Keep the first (most recent) certificate, delete the rest
      const toKeep = certGroup[0]
      const toDelete = certGroup.slice(1)
      
      console.log(`  📋 Keeping certificate ${toKeep.id} (created: ${toKeep.created_at})`)
      console.log(`  🗑️ Deleting ${toDelete.length} duplicate certificates`)
      
      for (const cert of toDelete) {
        console.log(`    🗑️ Deleting certificate ${cert.id} (created: ${cert.created_at})`)
        
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
            
            console.log(`      🗑️ Deleting file: ${filePathToDelete}`)
            const { error: storageError } = await supabase.storage
              .from('certificates')
              .remove([filePathToDelete])
            
            if (storageError) {
              console.error(`      ❌ Error deleting file: ${storageError.message}`)
            } else {
              console.log(`      ✅ Successfully deleted file`)
            }
          } catch (storageError) {
            console.error(`      ❌ Storage error: ${storageError.message}`)
          }
        }
        
        // Delete from database
        const { error: deleteError } = await supabase
          .from('certificates')
          .delete()
          .eq('id', cert.id)
        
        if (deleteError) {
          console.error(`      ❌ Error deleting from database: ${deleteError.message}`)
        } else {
          console.log(`      ✅ Successfully deleted from database`)
        }
      }
    }
    
    console.log('\n✅ Duplicate cleanup completed')
    
  } catch (error) {
    console.error('❌ Error in cleanup:', error)
  }
}

// Run the cleanup
cleanupDuplicateCertificates()
