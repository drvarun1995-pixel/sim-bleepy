import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { applyFileSecurityHeaders } from '@/lib/secure-file-access'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (!user || (user.role !== 'admin' && user.role !== 'meded_team')) {
      return applyFileSecurityHeaders(
        NextResponse.json({ error: 'Admin or MedEd Team access required' }, { status: 403 })
      )
    }

    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '100'), 10000)
    const resourceId = request.nextUrl.searchParams.get('resourceId')

    let query = supabaseAdmin
      .from('teaching_resource_download_tracking')
      .select(
        'id, resource_id, resource_name, category, user_email, user_name, download_timestamp, file_size, file_type'
      )
      .order('download_timestamp', { ascending: false })
      .limit(limit)

    if (resourceId) {
      query = query.eq('resource_id', resourceId)
    }

    const { data, error } = await query
    if (error) {
      console.error('Teaching download tracking fetch error:', error)
      const missing = /teaching_resource_download_tracking|schema cache|does not exist/i.test(error.message)
      return applyFileSecurityHeaders(
        NextResponse.json(
          {
            error: missing
              ? 'Teaching download tracking is not set up yet. Run migrations/create-teaching-resource-download-tracking.sql in Supabase.'
              : 'Failed to fetch teaching download data',
            downloads: [],
          },
          { status: missing ? 200 : 500 }
        )
      )
    }

    return applyFileSecurityHeaders(
      NextResponse.json({ library: 'teaching-resources', downloads: data || [] })
    )
  } catch (error) {
    console.error('Teaching download tracking fetch error:', error)
    return applyFileSecurityHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    )
  }
}
