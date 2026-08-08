import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { canManageFoundationYear, slugify } from '@/lib/foundation-year'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: topic, error } = await supabaseAdmin
      .from('fy_topics')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
      }
      console.error('Error fetching FY topic:', error)
      return NextResponse.json({ error: 'Failed to fetch topic' }, { status: 500 })
    }

    return NextResponse.json({ topic })
  } catch (error) {
    console.error('Error in FY topic GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!user || !canManageFoundationYear(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, icon, display_order, is_active } = body

    const { data: current } = await supabaseAdmin
      .from('fy_topics')
      .select('id, cohort, name')
      .eq('id', params.id)
      .single()

    if (!current) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) {
      updates.name = name

      if (name !== current.name) {
        const baseSlug = slugify(name, 'topic')
        let slug = baseSlug
        let counter = 1

        while (true) {
          const { data: existing } = await supabaseAdmin
            .from('fy_topics')
            .select('id')
            .eq('cohort', current.cohort)
            .eq('slug', slug)
            .neq('id', params.id)
            .maybeSingle()

          if (!existing) break
          slug = `${baseSlug}-${counter}`
          counter++
        }

        updates.slug = slug
      }
    }

    if (description !== undefined) updates.description = description
    if (icon !== undefined) updates.icon = icon
    if (display_order !== undefined) updates.display_order = display_order
    if (is_active !== undefined) updates.is_active = is_active

    const { data: topic, error } = await supabaseAdmin
      .from('fy_topics')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating FY topic:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ topic })
  } catch (error) {
    console.error('Error in FY topic PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!user || !canManageFoundationYear(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('fy_topics')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting FY topic:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in FY topic DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
