import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { cleanupDraftFolderById } from '@/lib/quiz/questionCleanup'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const folderId = typeof body.folderId === 'string' ? body.folderId.trim() : ''

    if (!folderId) {
      return NextResponse.json({ error: 'folderId is required' }, { status: 400 })
    }

    await cleanupDraftFolderById(folderId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cleaning up quiz draft folder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


