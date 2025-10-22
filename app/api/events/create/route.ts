import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

// POST - Create event with all relations
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check user role
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();
    
    if (!user || !['admin', 'educator', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }
    
    // Get request data
    const eventData = await request.json();
    
    // Extract relation IDs
    const speakerIds = eventData.speaker_ids || [];
    const categoryIds = eventData.category_ids || [];
    const locationIds = eventData.location_ids || [];
    const organizerIds = eventData.organizer_ids || [];
    
    // Remove relation arrays from event data
    const cleanEventData = { ...eventData };
    delete cleanEventData.speaker_ids;
    delete cleanEventData.category_ids;
    delete cleanEventData.location_ids;
    delete cleanEventData.organizer_ids;
    
    // Insert event
    const { data: newEvent, error: eventError } = await supabaseAdmin
      .from('events')
      .insert([cleanEventData])
      .select()
      .single();
    
    if (eventError) {
      console.error('Error creating event:', eventError);
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }
    
    // Link categories to event
    if (categoryIds.length > 0 && newEvent) {
      const categoryLinks = categoryIds.map((categoryId: string) => ({
        event_id: newEvent.id,
        category_id: categoryId
      }));
      
      const { error: categoriesError } = await supabaseAdmin
        .from('event_categories')
        .insert(categoryLinks);
      
      if (categoriesError) {
        console.error('Error linking categories:', categoriesError);
        // Don't fail the whole operation, just log the error
      }
    }
    
    // Link locations to event
    if (locationIds.length > 0 && newEvent) {
      const locationLinks = locationIds.map((locationId: string) => ({
        event_id: newEvent.id,
        location_id: locationId
      }));
      
      const { error: locationsError } = await supabaseAdmin
        .from('event_locations')
        .insert(locationLinks);
      
      if (locationsError) {
        console.error('Error linking locations:', locationsError);
        // Don't fail the whole operation, just log the error
      }
    }
    
    // Link organizers to event
    if (organizerIds.length > 0 && newEvent) {
      const organizerLinks = organizerIds.map((organizerId: string) => ({
        event_id: newEvent.id,
        organizer_id: organizerId
      }));
      
      const { error: organizersError } = await supabaseAdmin
        .from('event_organizers')
        .insert(organizerLinks);
      
      if (organizersError) {
        console.error('Error linking organizers:', organizersError);
        // Don't fail the whole operation, just log the error
      }
    }
    
    // Link speakers to event
    if (speakerIds.length > 0 && newEvent) {
      const speakerLinks = speakerIds.map((speakerId: string) => ({
        event_id: newEvent.id,
        speaker_id: speakerId
      }));
      
      const { error: speakersError } = await supabaseAdmin
        .from('event_speakers')
        .insert(speakerLinks);
      
      if (speakersError) {
        console.error('Error linking speakers:', speakersError);
        // Don't fail the whole operation, just log the error
      }
    }
    
    return NextResponse.json(newEvent);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}






























