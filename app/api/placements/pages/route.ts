import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

// GET - Fetch pages for a specialty
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialtyId = searchParams.get('specialtyId');
    const specialtySlug = searchParams.get('specialtySlug');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let resolvedSpecialtyId = specialtyId;

    // If specialtySlug is provided, get the specialty ID
    if (specialtySlug && !specialtyId) {
      const { data: specialty } = await supabaseAdmin
        .from('specialties')
        .select('id')
        .eq('slug', specialtySlug)
        .single();

      if (!specialty) {
        return NextResponse.json({ error: 'Specialty not found' }, { status: 404 });
      }

      resolvedSpecialtyId = specialty.id;
    }

    if (!resolvedSpecialtyId) {
      return NextResponse.json({ error: 'specialtyId or specialtySlug is required' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('specialty_pages')
      .select('*')
      .eq('specialty_id', resolvedSpecialtyId)
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
    const { specialty_id, title, content, display_order } = body;

    if (!specialty_id || !title) {
      return NextResponse.json({ error: 'specialty_id and title are required' }, { status: 400 });
    }

    // Generate slug from title
    let baseSlug = title.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    if (!baseSlug) {
      baseSlug = 'page';
    }

    // Ensure uniqueness by checking existing slugs and appending numbers if needed
    let finalSlug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const { data: existing } = await supabaseAdmin
        .from('specialty_pages')
        .select('id')
        .eq('specialty_id', specialty_id)
        .eq('slug', finalSlug)
        .single();

      if (!existing) {
        isUnique = true;
      } else {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const { data: page, error } = await supabaseAdmin
      .from('specialty_pages')
      .insert({
        specialty_id,
        title,
        slug: finalSlug,
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

