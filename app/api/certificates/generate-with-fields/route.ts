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
    const base64Data = canvasDataUrl.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const blob = new Blob([buffer], { type: 'image/png' })

    // Create proper folder structure: Generator Name > certificates > Event Name > Recipient Name > Certificate file
    const generatorName = certificateData.generator_name || session.user.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Generator'
    const recipientName = certificateData.attendee_name || 'Unknown_Recipient'
    const eventTitleSlug = certificateData.event_title.replace(/[^a-zA-Z0-9]/g, '_')
    const recipientNameSlug = recipientName.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${eventTitleSlug}_${certificateData.certificate_id}.png`
    const folderPath = `users/${generatorName}/certificates/${eventTitleSlug}/${recipientNameSlug}`
    const filePath = `${folderPath}/${filename}`
    
    console.log('📁 Storage path:', filePath)
    console.log('👤 Generator:', generatorName)
    console.log('👤 Recipient:', recipientName)

    // Upload the generated certificate to Supabase Storage
    console.log('📤 Uploading certificate to Supabase...')
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('certificates')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Error uploading certificate:', uploadError)
      console.error('❌ Upload error details:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error
      })
      return NextResponse.json({ error: 'Failed to upload certificate' }, { status: 500 })
    }

    console.log('✅ Certificate generated and uploaded successfully:', filePath)
    
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
    
    // Check if certificate already exists
    const { data: existingCert, error: checkError } = await supabaseAdmin
      .from('certificates')
      .select('id')
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

        // Also try to delete the file from storage
        try {
          const { error: storageDeleteError } = await supabaseAdmin.storage
            .from('certificates')
            .remove([filePath])
          
          if (storageDeleteError) {
            console.log('⚠️ Could not delete old file from storage (may not exist):', storageDeleteError.message)
          }
        } catch (storageError) {
          console.log('⚠️ Storage deletion failed (file may not exist):', storageError)
        }
      } else {
        console.log('⚠️ Certificate already exists for this user and event')
        return NextResponse.json({ 
          error: 'Certificate already exists for this attendee and event',
          code: 'DUPLICATE_CERTIFICATE'
        }, { status: 409 })
      }
    }

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

