import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Certificate template search API route hit!')
    
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

    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build search query
    let query = supabaseAdmin
      .from('certificate_templates')
      .select(`
        id, name, description, created_at, updated_at,
        users (
          id, name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Add search filter if query provided
    if (searchQuery.trim()) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    }

    const { data: templates, error: templatesError } = await query

    if (templatesError) {
      console.error('Error fetching certificate templates:', templatesError)
      return NextResponse.json({ 
        error: 'Failed to fetch certificate templates' 
      }, { status: 500 })
    }

    // Format response
    const formattedTemplates = (templates || []).map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      createdBy: template.users?.[0]?.name || 'Unknown',
      createdAt: template.created_at,
      updatedAt: template.updated_at
    }))

    return NextResponse.json({
      success: true,
      templates: formattedTemplates,
      total: formattedTemplates.length,
      searchQuery: searchQuery
    })

  } catch (error) {
    console.error('Error in certificate template search:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}


