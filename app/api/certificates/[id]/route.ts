import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const certificateId = params.id

    // First, get the certificate to delete the file from storage
    const { data: certificate, error: fetchError } = await supabaseAdmin
      .from('certificates')
      .select('certificate_filename, certificate_url, event_id, certificate_data')
      .eq('id', certificateId)
      .single()

    if (fetchError || !certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Delete from storage - handle both full path and filename cases
    let filePathToDelete = null
    
    if (certificate.certificate_filename) {
      // Check if it's a full path or just filename
      if (certificate.certificate_filename.includes('/')) {
        // It's already a full path
        filePathToDelete = certificate.certificate_filename
      } else {
        // It's just a filename, need to construct the full path
        // Extract path from certificate_url or construct from certificate_data
        if (certificate.certificate_url) {
          // Extract path from URL: https://...supabase.co/storage/v1/object/public/certificates/path
          const urlParts = certificate.certificate_url.split('/storage/v1/object/public/certificates/')
          if (urlParts.length > 1) {
            filePathToDelete = urlParts[1]
          }
        }
        
        // If we still don't have a path, try to construct it from certificate_data
        if (!filePathToDelete && certificate.certificate_data) {
          const data = certificate.certificate_data
          const generatorName = data.generator_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Generator'
          const eventTitleSlug = data.event_title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Event'
          const recipientNameSlug = data.attendee_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Recipient'
          filePathToDelete = `users/${generatorName}/certificates/${eventTitleSlug}/${recipientNameSlug}/${certificate.certificate_filename}`
        }
      }
    }

    if (filePathToDelete) {
      try {
        console.log('Deleting certificate file from storage:', filePathToDelete)
        const { error: storageError } = await supabaseAdmin.storage
          .from('certificates')
          .remove([filePathToDelete])
        
        if (storageError) {
          console.error('Error deleting from storage:', storageError)
          // Continue with database deletion even if storage deletion fails
        } else {
          console.log('Successfully deleted certificate file from storage')
        }
      } catch (error) {
        console.error('Storage deletion error:', error)
        // Continue with database deletion even if storage deletion fails
      }
    } else {
      console.log('No file path found to delete from storage')
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('certificates')
      .delete()
      .eq('id', certificateId)

    if (deleteError) {
      console.error('Error deleting certificate from database:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Certificate deleted successfully' 
    }, { status: 200 })

  } catch (error) {
    console.error('Error in DELETE /api/certificates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}








