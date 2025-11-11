import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// GET - List all categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive') === 'true'

    let query = supabaseAdmin
      .from('quiz_categories')
      .select('*')
      .order('order_index', { ascending: true })
      .order('name', { ascending: true })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json({ categories: categories || [] })
  } catch (error) {
    console.error('Error in GET /api/quiz/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, order_index, is_active } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // Check if category already exists
    const { data: existing } = await supabaseAdmin
      .from('quiz_categories')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
    }

    // Get max order_index if not provided
    let finalOrderIndex = order_index
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const { data: lastCategory } = await supabaseAdmin
        .from('quiz_categories')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)
        .single()

      finalOrderIndex = lastCategory?.order_index !== undefined ? (lastCategory.order_index + 1) : 0
    }

    const { data: category, error } = await supabaseAdmin
      .from('quiz_categories')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        order_index: finalOrderIndex,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/quiz/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

