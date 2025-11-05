import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

// GET - Fetch pages for a specialty
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialtyId = searchParams.get('specialtyId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (!specialtyId) {
      return NextResponse.json({ error: 'specialtyId is required' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('specialty_pages')
      .select('*')
      .eq('specialty_id', specialtyId)
      .order('display_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: pages, error } = await query;

    if (error) {
      console.error('Error fetching specialty pages:', error);
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }

    return NextResponse.json({ pages: pages || [] });
  } catch (error) {
    console.error('Error in specialty pages API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new specialty page
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (!user || !['admin', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { specialty_id, title, slug, content, display_order } = body;

    if (!specialty_id || !title || !slug) {
      return NextResponse.json({ error: 'specialty_id, title, and slug are required' }, { status: 400 });
    }

    const { data: page, error } = await supabaseAdmin
      .from('specialty_pages')
      .insert({
        specialty_id,
        title,
        slug,
        content: content || null,
        display_order: display_order || 0,
        is_active: true,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating specialty page:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error in create specialty page API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

