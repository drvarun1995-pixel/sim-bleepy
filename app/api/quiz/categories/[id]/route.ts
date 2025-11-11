import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// PUT - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()
    const { name, description, order_index, is_active } = body

    // Check if category exists
    const { data: existing } = await supabaseAdmin
      .from('quiz_categories')
      .select('id, name')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // If name is being changed, check if new name already exists
    if (name && name.trim() !== existing.name) {
      const { data: duplicate } = await supabaseAdmin
        .from('quiz_categories')
        .select('id')
        .eq('name', name.trim())
        .neq('id', id)
        .single()

      if (duplicate) {
        return NextResponse.json({ error: 'Category name already exists' }, { status: 409 })
      }
    }

    // Build update object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (order_index !== undefined) updateData.order_index = order_index
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: category, error } = await supabaseAdmin
      .from('quiz_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error in PUT /api/quiz/categories/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Check if category exists
    const { data: existing } = await supabaseAdmin
      .from('quiz_categories')
      .select('id, name')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if category is used in questions
    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('id')
      .eq('category', existing.name)
      .limit(1)

    if (questions && questions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that is used in questions. Deactivate it instead.' },
        { status: 400 }
      )
    }

    // Delete the category
    const { error } = await supabaseAdmin
      .from('quiz_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/quiz/categories/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

