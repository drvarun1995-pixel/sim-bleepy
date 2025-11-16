import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { deleteAnnouncementDraftFolder } from '@/lib/admin-announcement-images'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!user || !['admin', 'educator', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { draftId } = body

    if (!draftId) {
      return NextResponse.json({ error: 'draftId is required' }, { status: 400 })
    }

    // Clean up draft folder
    await deleteAnnouncementDraftFolder(draftId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/announcements/drafts/cleanup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

