import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

interface BulkEvent {
  id?: string; // temporary ID
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  locationId?: string;
  location?: string;
  categoryId?: string;
  category?: string;
  formatId?: string;
  format?: string;
  organizerId?: string;
  organizer?: string;
  speakerIds?: string[];
  speakers?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Parse request body
    const { events } = await request.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    // Validate each event
    for (const event of events) {
      if (!event.title || !event.date || !event.startTime) {
        return NextResponse.json(
          { error: 'Each event must have a title, date, and start time' },
          { status: 400 }
        );
      }
    }

    // Create events
    const createdEvents = [];
    const errors = [];

    for (const event of events) {
      try {
        // Prepare event data for database
        const eventData: any = {
          title: event.title,
          description: event.description || null,
          date: event.date,
          start_time: event.startTime,
          end_time: event.endTime || null,
          location_id: event.locationId || null,
          category_id: event.categoryId || null,
          format_id: event.formatId || null,
          organizer_id: event.organizerId || null,
          author_id: user.id,
          author_name: session.user.name || session.user.email,
          status: 'published',
          event_status: 'scheduled',
          is_all_day: false,
          hide_time: false,
          hide_end_time: false,
          hide_location: false,
          hide_organizer: false,
          hide_speakers: false,
          attendees: 0
        };

        // Insert event
        const { data: createdEvent, error: insertError } = await supabaseAdmin
          .from('events')
          .insert(eventData)
          .select('id')
          .single();

        if (insertError) {
          console.error('Error inserting event:', insertError);
          errors.push({
            title: event.title,
            error: insertError.message
          });
          continue;
        }

        // If speakers are provided, create the junction table entries
        if (event.speakerIds && event.speakerIds.length > 0 && createdEvent) {
          const speakerLinks = event.speakerIds.map((speakerId: string) => ({
            event_id: createdEvent.id,
            speaker_id: speakerId
          }));

          const { error: speakerError } = await supabaseAdmin
            .from('event_speakers')
            .insert(speakerLinks);

          if (speakerError) {
            console.error('Error linking speakers:', speakerError);
            // Don't fail the entire operation, just log
          }
        }

        createdEvents.push(createdEvent);

      } catch (error: any) {
        console.error('Error creating event:', error);
        errors.push({
          title: event.title,
          error: error.message
        });
      }
    }

    // Return results
    return NextResponse.json({
      created: createdEvents.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully created ${createdEvents.length} event(s)${
        errors.length > 0 ? `, ${errors.length} failed` : ''
      }`
    });

  } catch (error: any) {
    console.error('Bulk upload create error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create events' },
      { status: 500 }
    );
  }
}

