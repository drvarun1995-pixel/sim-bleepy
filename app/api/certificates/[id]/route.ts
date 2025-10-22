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
      .select('certificate_filename, event_id')
      .eq('id', certificateId)
      .single()

    if (fetchError || !certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Delete from storage
    if (certificate.certificate_filename) {
      try {
        console.log('Deleting certificate file from storage:', certificate.certificate_filename)
        const { error: storageError } = await supabaseAdmin.storage
          .from('certificates')
          .remove([certificate.certificate_filename])
        
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








