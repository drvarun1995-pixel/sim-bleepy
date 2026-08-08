import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import { canManageFoundationYear, fyImageScope, slugify } from '@/lib/foundation-year'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: page, error } = await supabaseAdmin
      .from('fy_pages')
      .select('*')
      .eq('id', params.id)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 })
      }
      console.error('Error fetching FY page:', error)
      return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Error in FY page GET:', error)
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
    const { title, content, display_order, is_active, featured_image, status } = body

    const { data: currentPage } = await supabaseAdmin
      .from('fy_pages')
      .select('topic_id, slug, title')
      .eq('id', params.id)
      .single()

    if (!currentPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined && title !== currentPage.title) {
      const baseSlug = slugify(title, 'page')
      let finalSlug = baseSlug
      let counter = 1

      while (true) {
        const { data: existing } = await supabaseAdmin
          .from('fy_pages')
          .select('id')
          .eq('topic_id', currentPage.topic_id)
          .eq('slug', finalSlug)
          .neq('id', params.id)
          .maybeSingle()

        if (!existing) break
        finalSlug = `${baseSlug}-${counter}`
        counter++
      }

      updates.title = title
      updates.slug = finalSlug
    } else if (title !== undefined) {
      updates.title = title
    }

    if (content !== undefined) updates.content = content
    if (display_order !== undefined) updates.display_order = display_order
    if (is_active !== undefined) updates.is_active = is_active
    if (featured_image !== undefined) updates.featured_image = featured_image
    if (status !== undefined) updates.status = status

    const { data: page, error } = await supabaseAdmin
      .from('fy_pages')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating FY page:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Error in FY page PUT:', error)
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

    const { data: page } = await supabaseAdmin
      .from('fy_pages')
      .select('slug, topic_id, fy_topics!inner(cohort, slug)')
      .eq('id', params.id)
      .single()

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const topic = (page as any).fy_topics
    const folderPath = `${fyImageScope(topic.cohort, topic.slug)}/${page.slug}`

    try {
      const nestedFolders = ['images', 'documents']
      const filePaths: string[] = []

      for (const nestedFolder of nestedFolders) {
        const nestedPath = `${folderPath}/${nestedFolder}`
        const { data: nestedFiles } = await supabaseAdmin.storage
          .from('placements')
          .list(nestedPath, { limit: 1000, offset: 0 })

        if (nestedFiles?.length) {
          filePaths.push(
            ...nestedFiles.filter((f) => f.name).map((f) => `${nestedPath}/${f.name}`)
          )
        }
      }

      if (filePaths.length > 0) {
        await supabaseAdmin.storage.from('placements').remove(filePaths)
      }
    } catch (storageError) {
      console.error('Error cleaning FY page storage:', storageError)
    }

    const { error } = await supabaseAdmin
      .from('fy_pages')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting FY page:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in FY page DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
