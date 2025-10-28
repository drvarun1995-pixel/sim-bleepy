import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting certificate generation...')
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('✅ Session found:', session.user.name)

    const { 
      templateId, 
      certificateData, 
      canvasDataUrl,
      regenerateExisting = false
    } = await request.json()

    console.log('📋 Request data:', { templateId, certificateData: !!certificateData, canvasDataUrl: !!canvasDataUrl })

    if (!templateId || !certificateData || !canvasDataUrl) {
      console.log('❌ Missing required fields')
      return NextResponse.json({ 
        error: 'Missing required fields: templateId, certificateData, canvasDataUrl' 
      }, { status: 400 })
    }

    // Get user role
    console.log('🔍 Checking user permissions...')
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      console.log('❌ User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole = user.role
    console.log('👤 User role:', userRole)
    if (!['admin', 'meded_team', 'ctf'].includes(userRole)) {
      console.log('❌ Insufficient permissions')
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Convert canvas data URL to blob
    console.log('🖼️ Converting canvas data to blob...')
    console.log('🖼️ Canvas data URL length:', canvasDataUrl?.length || 0)
    console.log('🖼️ Canvas data URL starts with data:image:', canvasDataUrl?.startsWith('data:image/') || false)
    
    if (!canvasDataUrl || !canvasDataUrl.startsWith('data:image/')) {
      console.error('❌ Invalid canvas data URL:', canvasDataUrl)
      return NextResponse.json({ 
        error: 'Invalid canvas data URL' 
      }, { status: 400 })
    }
    
    const base64Data = canvasDataUrl.replace(/^data:image\/png;base64,/, '')
    console.log('🖼️ Base64 data length:', base64Data.length)
    
    const buffer = Buffer.from(base64Data, 'base64')
    console.log('🖼️ Buffer size:', buffer.length)
    
    const blob = new Blob([buffer], { type: 'image/png' })
    console.log('🖼️ Blob created successfully, size:', blob.size)

    // Create proper folder structure: users > Generator Name > certificates > Event Name > Certificate file
    const generatorName = certificateData.generator_name || session.user.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Generator'
    const recipientName = certificateData.attendee_name || 'Unknown_Recipient'
    const eventTitleSlug = certificateData.event_title.replace(/[^a-zA-Z0-9]/g, '_')
    const attendeeNameSlug = recipientName.replace(/[^a-zA-Z0-9]/g, '_')
    
    // Format date as dd/mm/yyyy
    const eventDate = new Date(certificateData.event_date)
    const formattedDate = eventDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-') // Replace / with - for filename safety
    
    const filename = `${eventTitleSlug}_${attendeeNameSlug}_${formattedDate}_${certificateData.certificate_id}.png`
    const folderPath = `users/${generatorName}/certificates/${eventTitleSlug}`
    const filePath = `${folderPath}/${filename}`
    
    console.log('📁 Storage path:', filePath)
    console.log('👤 Generator:', generatorName)
    console.log('👤 Recipient:', recipientName)

    // Check if certificate already exists BEFORE uploading
    console.log('🔍 Checking for existing certificate before upload...')
    const { data: existingCert, error: checkError } = await supabaseAdmin
      .from('certificates')
      .select('id, certificate_filename, certificate_url')
      .eq('user_id', certificateData.user_id)
      .eq('event_id', certificateData.event_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error checking for existing certificate:', checkError)
      return NextResponse.json({ error: 'Failed to check for existing certificate' }, { status: 500 })
    }

    if (existingCert) {
      if (regenerateExisting) {
        console.log('🔄 Regenerating existing certificate - deleting old one first')
        
        // Delete the old certificate file from storage
        if (existingCert.certificate_url) {
          try {
            const url = new URL(existingCert.certificate_url)
            const pathParts = url.pathname.split('/')
            const certificatesIndex = pathParts.indexOf('certificates')
            if (certificatesIndex !== -1 && certificatesIndex < pathParts.length - 1) {
              const oldFilePath = pathParts.slice(certificatesIndex + 1).join('/')
              console.log('🗑️ Deleting old certificate file from storage:', oldFilePath)
              
              const { error: storageDeleteError } = await supabaseAdmin.storage
                .from('certificates')
                .remove([oldFilePath])
              
              if (storageDeleteError) {
                console.error('❌ Error deleting old certificate file:', storageDeleteError)
              } else {
                console.log('✅ Successfully deleted old certificate file from storage')
              }
            }
          } catch (error) {
            console.error('❌ Error parsing old certificate URL:', error)
          }
        }
        
        // Delete the existing certificate from database
        const { error: deleteError } = await supabaseAdmin
          .from('certificates')
          .delete()
          .eq('user_id', certificateData.user_id)
          .eq('event_id', certificateData.event_id)

        if (deleteError) {
          console.error('❌ Error deleting existing certificate:', deleteError)
          return NextResponse.json({ error: 'Failed to delete existing certificate' }, { status: 500 })
        }
        
        console.log('✅ Successfully deleted old certificate from database')
      } else {
        return NextResponse.json({ 
          error: 'Certificate already exists for this attendee and event',
          code: 'DUPLICATE_CERTIFICATE'
        }, { status: 409 })
      }
    }

    // Upload the generated certificate to Supabase Storage
    console.log('📤 Uploading certificate to Supabase...')
    console.log('📤 File path:', filePath)
    console.log('📤 Blob size:', blob.size)
    console.log('📤 Blob type:', blob.type)
    
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('certificates')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Error uploading certificate:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload certificate',
        details: uploadError.message 
      }, { status: 500 })
    }

    console.log('✅ Certificate generated and uploaded successfully:', filePath)
    console.log('✅ Upload data:', data)
    
    // Create the certificate URL
    const certificateUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certificates/${filePath}`
    
    // Debug: Log the data being inserted
    console.log('🔍 Certificate data for database:', {
      user_id: certificateData.user_id,
      event_id: certificateData.event_id,
      template_id: templateId,
      certificate_url: certificateUrl,
      certificate_filename: filename,
      certificate_data: certificateData,
      generated_by: session.user.id
    })
    

    // Save certificate to database
    const { data: certificateRecord, error: dbError } = await supabaseAdmin
      .from('certificates')
      .insert([{
        user_id: certificateData.user_id,
        event_id: certificateData.event_id,
        template_id: templateId,
        certificate_url: certificateUrl,
        certificate_filename: filename,
        certificate_data: certificateData,
        generated_by: session.user.id,
        generated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (dbError) {
      console.error('❌ Error saving certificate to database:', dbError)
      console.error('❌ Database error details:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code
      })
      return NextResponse.json({ error: 'Failed to save certificate to database' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      filePath: filePath,
      certificateUrl: certificateUrl,
      certificate: certificateRecord
    })

  } catch (error) {
    console.error('❌ Certificate generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

