import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { fetchQrAttendance } from '@/lib/qrAttendance'

export async function GET(
  request: NextRequest,
  { params }: { params: { qrCodeId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!['admin', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { scanCount, attendees } = await fetchQrAttendance(params.qrCodeId)

    return NextResponse.json({
      success: true,
      scanCount,
      attendees,
    })
  } catch (error) {
    console.error('Error in GET /api/qr-codes/attendees/[qrCodeId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
