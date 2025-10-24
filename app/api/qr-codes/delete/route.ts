import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deleting QR code')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
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

    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json({ 
        error: 'Missing required field: eventId' 
      }, { status: 400 })
    }

    // Get QR code data first to get the image URL
    const { data: qrCode, error: qrError } = await supabaseAdmin
      .from('event_qr_codes')
      .select('id, qr_code_image_url')
      .eq('event_id', eventId)
      .single()

    if (qrError) {
      if (qrError.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'QR code not found for this event' 
        }, { status: 404 })
      }
      console.error('Error fetching QR code:', qrError)
      return NextResponse.json({ 
        error: 'Failed to fetch QR code' 
      }, { status: 500 })
    }

    // Delete all QR code images for this event from storage
    if (qrCode.qr_code_image_url) {
      try {
        const url = new URL(qrCode.qr_code_image_url)
        const pathParts = url.pathname.split('/')
        const fileName = pathParts[pathParts.length - 1]
        const folderName = pathParts[pathParts.length - 2] // Get the folder name
        
        console.log('🗑️ Deleting QR code images from storage folder:', folderName)
        
        // List all files in the event folder
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from('qr-codes')
          .list(folderName)
        
        if (!listError && files && files.length > 0) {
          // Delete all files in the folder
          const filePaths = files.map(file => `${folderName}/${file.name}`)
          console.log('🗑️ Deleting files:', filePaths)
          
          const { error: storageError } = await supabaseAdmin.storage
            .from('qr-codes')
            .remove(filePaths)

          if (storageError) {
            console.error('Error deleting from storage:', storageError)
            // Don't fail the whole operation if storage deletion fails
          } else {
            console.log('✅ All QR code images deleted from storage folder')
          }
        } else {
          console.log('⚠️ No files found in storage folder or error listing files')
        }
      } catch (urlError) {
        console.error('Error parsing image URL:', urlError)
        // Continue with database deletion even if URL parsing fails
      }
    }

    // Delete QR code from database
    const { error: deleteError } = await supabaseAdmin
      .from('event_qr_codes')
      .delete()
      .eq('event_id', eventId)

    if (deleteError) {
      console.error('Error deleting QR code from database:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete QR code from database' 
      }, { status: 500 })
    }

    console.log('✅ QR code deleted successfully for event:', eventId)

    return NextResponse.json({
      success: true,
      message: 'QR code deleted successfully'
    })

  } catch (error) {
    console.error('Error in deleting QR code:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

