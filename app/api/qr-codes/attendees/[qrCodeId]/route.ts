import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { qrCodeId: string } }
) {
  try {
    console.log('👥 Getting attendees for QR code:', params.qrCodeId)
    
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

    // Get attendees who scanned this QR code
    const { data: attendees, error: attendeesError } = await supabaseAdmin
      .from('qr_code_scans')
      .select(`
        id,
        user_name,
        scanned_at,
        scan_success
      `)
      .eq('qr_code_id', params.qrCodeId)
      .eq('scan_success', true)
      .order('scanned_at', { ascending: false })

    if (attendeesError) {
      console.error('Error fetching attendees:', attendeesError)
      return NextResponse.json({ 
        error: 'Failed to fetch attendees' 
      }, { status: 500 })
    }

    console.log('✅ Attendees retrieved successfully:', attendees?.length || 0)

    return NextResponse.json({
      success: true,
      attendees: attendees || []
    })

  } catch (error) {
    console.error('Error in GET /api/qr-codes/attendees/[qrCodeId]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
