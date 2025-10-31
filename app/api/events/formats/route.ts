import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

// GET - Get formats
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get formats with counts
    const { data, error } = await supabaseAdmin
      .from('formats_with_counts')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching formats:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create format
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, slug, parent_id, description, color } = await request.json();

    const normalizedParentId = parent_id && typeof parent_id === 'string' && parent_id.trim() !== ''
      ? parent_id
      : null;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Format name is required' }, { status: 400 });
    }

    // Create format
    const { data, error } = await supabaseAdmin
      .from('formats')
      .insert([{
        name: name.trim(),
        slug: slug || name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        parent_id: normalizedParentId,
        description: description?.trim() || null,
        color: color || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating format:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update format
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, slug, parent_id, description, color } = await request.json();

    const normalizedParentId = parent_id && typeof parent_id === 'string' && parent_id.trim() !== ''
      ? parent_id
      : null;

    if (!id) {
      return NextResponse.json({ error: 'Format ID is required' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Format name is required' }, { status: 400 });
    }

    // Update format
    const { data, error } = await supabaseAdmin
      .from('formats')
      .update({ 
        name: name.trim(),
        slug: slug || name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        parent_id: normalizedParentId,
        description: description?.trim() || null,
        color: color || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating format:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete format
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get format ID from query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Format ID is required' }, { status: 400 });
    }

    // Delete format
    const { error } = await supabaseAdmin
      .from('formats')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting format:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}