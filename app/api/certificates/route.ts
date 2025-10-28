import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole = user.role
    if (!['admin', 'meded_team', 'ctf'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get certificates with related data
    const { data: certificates, error } = await supabaseAdmin
      .from('certificates')
      .select(`
        *,
        events (title, date, location_id, locations (name)),
        users!certificates_user_id_fkey (name, email),
        generated_by_user:users!certificates_generated_by_fkey (name)
      `)
      .order('generated_at', { ascending: false })

    if (error) {
      console.error('Error fetching certificates:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, certificates: certificates || [] }, { status: 200 })

  } catch (error) {
    console.error('Error in GET /api/certificates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the certificate data from the request
    const certificateData = await request.json()
    
    console.log('📥 Received certificate data:', certificateData)
    console.log('📥 Required fields check:', {
      user_id: !!certificateData.user_id,
      event_id: !!certificateData.event_id,
      certificate_id: !!certificateData.certificate_id,
      certificate_path: !!certificateData.certificate_path
    })

    // Validate required fields
    if (!certificateData.user_id || !certificateData.event_id || !certificateData.certificate_id) {
      console.error('❌ Missing required fields:', {
        user_id: certificateData.user_id,
        event_id: certificateData.event_id,
        certificate_id: certificateData.certificate_id
      })
      return NextResponse.json(
        { error: 'Missing required fields: user_id, event_id, certificate_id' },
        { status: 400 }
      )
    }

    // Check for existing certificate and delete it if found
    console.log('🔍 Checking for existing certificate...')
    const { data: existingCert, error: checkError } = await supabaseAdmin
      .from('certificates')
      .select('id, certificate_filename, certificate_url')
      .eq('event_id', certificateData.event_id)
      .eq('user_id', certificateData.user_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected
      console.error('Error checking for existing certificate:', checkError)
      return NextResponse.json({ error: 'Failed to check for existing certificate' }, { status: 500 })
    }

    if (existingCert) {
      console.log('🗑️ Found existing certificate, deleting it first...')
      
      // Only delete the old certificate file if it's different from the new one
      const newFilePath = certificateData.certificate_path
      const oldFilePath = existingCert.certificate_filename
      
      // Extract just the filename from the new path for comparison
      const newFileName = newFilePath.split('/').pop()
      const oldFileName = oldFilePath
      
      console.log('🔄 Comparing filenames:')
      console.log('🔄 New filename:', newFileName)
      console.log('🔄 Old filename:', oldFileName)
      
      if (oldFileName && oldFileName !== newFileName) {
        try {
          // Use the stored certificate_url to get the correct file path
          let filePathToDelete = oldFilePath
          
          // If we have a certificate_url, extract the path from it
          if (existingCert.certificate_url) {
            const url = new URL(existingCert.certificate_url)
            const pathParts = url.pathname.split('/')
            // Extract the path after 'certificates/' from the URL
            const certificatesIndex = pathParts.indexOf('certificates')
            if (certificatesIndex !== -1 && certificatesIndex < pathParts.length - 1) {
              filePathToDelete = pathParts.slice(certificatesIndex + 1).join('/')
            }
          }
          
          console.log('🗑️ Deleting old certificate file from storage:', filePathToDelete)
          console.log('🗑️ New certificate path:', newFilePath)
          console.log('🗑️ Old certificate path:', oldFilePath)
          
          const { error: storageDeleteError } = await supabaseAdmin.storage
            .from('certificates')
            .remove([filePathToDelete])
          
          if (storageDeleteError) {
            console.error('Error deleting existing certificate file from storage:', storageDeleteError)
            // Continue with database deletion even if storage deletion fails
          } else {
            console.log('✅ Successfully deleted old certificate file from storage')
          }
        } catch (storageError) {
          console.error('Storage deletion error:', storageError)
          // Continue with database deletion even if storage deletion fails
        }
      } else {
        console.log('🔄 Old and new certificates have the same path, skipping file deletion')
      }
      
      // Delete the existing certificate record from database
      const { error: deleteError } = await supabaseAdmin
        .from('certificates')
        .delete()
        .eq('id', existingCert.id)
      
      if (deleteError) {
        console.error('Error deleting existing certificate from database:', deleteError)
        return NextResponse.json({ error: 'Failed to delete existing certificate' }, { status: 500 })
      }
      
      console.log('✅ Successfully deleted existing certificate from database')
    }

    // Insert the certificate using the correct column names
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .insert([{
        id: certificateData.certificate_id, // Use the provided certificate_id as the primary key
        user_id: certificateData.user_id,
        event_id: certificateData.event_id,
        template_id: certificateData.template_id || null,
        certificate_url: certificateData.certificate_url,
        certificate_filename: certificateData.certificate_path ? certificateData.certificate_path.split('/').pop() : null,
        certificate_data: certificateData.certificate_data,
        generated_by: session.user.id,
        generated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error inserting certificate:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, certificate: data }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/certificates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}








