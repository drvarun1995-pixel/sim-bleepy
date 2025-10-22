import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      templateId, 
      certificateData, 
      canvasDataUrl 
    } = await request.json()

    if (!templateId || !certificateData || !canvasDataUrl) {
      return NextResponse.json({ 
        error: 'Missing required fields: templateId, certificateData, canvasDataUrl' 
      }, { status: 400 })
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

    // Convert canvas data URL to blob
    const base64Data = canvasDataUrl.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const blob = new Blob([buffer], { type: 'image/png' })

    // Create proper folder structure: User > Attendee name > Certificate file
    const userId = certificateData.user_id || session.user.id
    const eventTitleSlug = certificateData.event_title.replace(/[^a-zA-Z0-9]/g, '_')
    const attendeeNameSlug = certificateData.attendee_name.replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `${eventTitleSlug}_${certificateData.certificate_id}.png`
    const folderPath = `users/${userId}/certificates/${attendeeNameSlug}`
    const filePath = `${folderPath}/${filename}`

    // Upload the generated certificate to Supabase Storage
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('certificates')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Error uploading certificate:', uploadError)
      return NextResponse.json({ error: 'Failed to upload certificate' }, { status: 500 })
    }

    console.log('✅ Certificate generated and uploaded successfully:', filePath)
    
    return NextResponse.json({
      success: true,
      filePath: filePath,
      certificateUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certificates/${filePath}`
    })

  } catch (error) {
    console.error('❌ Certificate generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
