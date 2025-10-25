import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

// GET - Get speakers
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get speakers
    const { data, error } = await supabaseAdmin
      .from('speakers')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching speakers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create speaker
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, role } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Speaker name is required' }, { status: 400 });
    }

    if (!role || !role.trim()) {
      return NextResponse.json({ error: 'Speaker role is required' }, { status: 400 });
    }

    // Create speaker
    const { data, error } = await supabaseAdmin
      .from('speakers')
      .insert([{ 
        name: name.trim(),
        role: role.trim()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating speaker:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update speaker
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, role } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Speaker ID is required' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Speaker name is required' }, { status: 400 });
    }

    if (!role || !role.trim()) {
      return NextResponse.json({ error: 'Speaker role is required' }, { status: 400 });
    }

    // Update speaker
    const { data, error } = await supabaseAdmin
      .from('speakers')
      .update({ 
        name: name.trim(),
        role: role.trim()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating speaker:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete speaker
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get speaker ID from query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Speaker ID is required' }, { status: 400 });
    }

    // Delete speaker
    const { error } = await supabaseAdmin
      .from('speakers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting speaker:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}