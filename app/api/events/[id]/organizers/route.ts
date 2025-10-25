import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

// GET - Get all organizers for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Get all organizers for this event
    const { data, error } = await supabaseAdmin
      .from('event_organizers')
      .select(`
        id,
        is_main_organizer,
        organizer_id,
        organizers!inner (
          id,
          name
        )
      `)
      .eq('event_id', eventId)
      .order('is_main_organizer', { ascending: false })
      .order('organizers.name');

    if (error) {
      console.error('Error fetching event organizers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add an organizer to an event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const { organizer_id, is_main_organizer = false } = await request.json();

    if (!organizer_id) {
      return NextResponse.json({ error: 'Organizer ID is required' }, { status: 400 });
    }

    // Add organizer to event
    const { data, error } = await supabaseAdmin
      .from('event_organizers')
      .insert([{
        event_id: eventId,
        organizer_id: organizer_id,
        is_main_organizer: is_main_organizer
      }])
      .select(`
        id,
        is_main_organizer,
        organizer_id,
        organizers!inner (
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error('Error adding organizer to event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove an organizer from an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const { searchParams } = new URL(request.url);
    const organizerId = searchParams.get('organizer_id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    if (!organizerId) {
      return NextResponse.json({ error: 'Organizer ID is required' }, { status: 400 });
    }

    // Remove organizer from event
    const { error } = await supabaseAdmin
      .from('event_organizers')
      .delete()
      .eq('event_id', eventId)
      .eq('organizer_id', organizerId);

    if (error) {
      console.error('Error removing organizer from event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update organizer role (main vs additional)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const { organizer_id, is_main_organizer } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    if (!organizer_id) {
      return NextResponse.json({ error: 'Organizer ID is required' }, { status: 400 });
    }

    // Update organizer role
    const { data, error } = await supabaseAdmin
      .from('event_organizers')
      .update({ is_main_organizer: is_main_organizer })
      .eq('event_id', eventId)
      .eq('organizer_id', organizer_id)
      .select(`
        id,
        is_main_organizer,
        organizer_id,
        organizers!inner (
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error('Error updating organizer role:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


