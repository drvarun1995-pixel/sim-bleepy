import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { EMAIL_BUCKET_ID, EMAIL_DRAFT_PREFIX } from '@/lib/admin-email-images'

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

    if (!user || !['admin', 'meded_team'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const imagePaths: string[] = Array.isArray(body?.imagePaths) ? body.imagePaths : []

    if (imagePaths.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 })
    }

    const draftPaths = imagePaths.filter((path) => path.startsWith(`${EMAIL_DRAFT_PREFIX}/`))
    if (draftPaths.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 })
    }

    const { error } = await supabaseAdmin.storage.from(EMAIL_BUCKET_ID).remove(draftPaths)
    if (error) {
      console.error('Failed to cleanup admin email images:', error)
      return NextResponse.json({ error: 'Failed to delete some files' }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: draftPaths.length })
  } catch (error) {
    console.error('Error in POST /api/admin/emails/images/cleanup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

