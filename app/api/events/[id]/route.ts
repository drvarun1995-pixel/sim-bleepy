import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('events_with_details')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error) {
      console.error('Error fetching event:', error);
      return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }
    
    // Ensure event has proper author information
    if (data) {
      if (data.author_name) {
        data.author = { 
          id: data.author_id || null, 
          email: null, 
          name: data.author_name 
        };
        console.log('✅ Set author for event:', data.title, 'Author:', data.author_name);
      } else if (data.author_id) {
        // Try to fetch author information from database
        try {
          console.log('🔍 Fetching author for ID:', data.author_id);
          const { data: author, error: authorError } = await supabaseAdmin
            .from('users')
            .select('id, email, name')
            .eq('id', data.author_id)
            .single();
          
          if (!authorError && author) {
            data.author = { 
              id: author.id, 
              email: author.email, 
              name: author.name 
            };
            console.log('✅ Set author from database for event:', data.title, 'Author:', author.name);
          } else {
            console.error('❌ Error fetching author:', authorError);
            console.log('⚠️ Event has author_id but author not found in database:', data.title, 'author_id:', data.author_id);
            data.author = { 
              id: data.author_id, 
              email: null, 
              name: 'Unknown User' 
            };
          }
        } catch (error) {
          console.warn('Error fetching author for event:', error);
          data.author = { 
            id: data.author_id, 
            email: null, 
            name: 'Unknown User' 
          };
        }
      } else {
        console.log('⚠️ Event has no author information:', data.title);
        data.author = { 
          id: null, 
          email: null, 
          name: 'Unknown User' 
        };
      }
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in event API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update event with all relations
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const updates = await request.json();
    
    // Extract relation IDs
    const speakerIds = updates.speaker_ids;
    const categoryIds = updates.category_ids;
    const locationIds = updates.location_ids;
    const organizerIds = updates.organizer_ids;
    
    // Remove relation arrays from event data
    const cleanUpdates = { ...updates };
    delete cleanUpdates.speaker_ids;
    delete cleanUpdates.category_ids;
    delete cleanUpdates.location_ids;
    delete cleanUpdates.organizer_ids;
    
    // Update event
    const { error: updateError } = await supabaseAdmin
      .from('events')
      .update(cleanUpdates)
      .eq('id', params.id);
    
    if (updateError) {
      console.error('Error updating event:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    // Update categories if provided
    if (categoryIds !== undefined) {
      // Delete existing category links
      await supabaseAdmin
        .from('event_categories')
        .delete()
        .eq('event_id', params.id);
      
      // Add new category links
      if (categoryIds.length > 0) {
        const categoryLinks = categoryIds.map((categoryId: string) => ({
          event_id: params.id,
          category_id: categoryId
        }));
        
        const { error: categoriesError } = await supabaseAdmin
          .from('event_categories')
          .insert(categoryLinks);
        
        if (categoriesError) {
          console.error('Error updating categories:', categoriesError);
        }
      }
    }
    
    // Update locations if provided
    if (locationIds !== undefined) {
      // Delete existing location links
      await supabaseAdmin
        .from('event_locations')
        .delete()
        .eq('event_id', params.id);
      
      // Add new location links
      if (locationIds.length > 0) {
        const locationLinks = locationIds.map((locationId: string) => ({
          event_id: params.id,
          location_id: locationId
        }));
        
        const { error: locationsError } = await supabaseAdmin
          .from('event_locations')
          .insert(locationLinks);
        
        if (locationsError) {
          console.error('Error updating locations:', locationsError);
        }
      }
    }
    
    // Update organizers if provided
    if (organizerIds !== undefined) {
      // Delete existing organizer links
      await supabaseAdmin
        .from('event_organizers')
        .delete()
        .eq('event_id', params.id);
      
      // Add new organizer links
      if (organizerIds.length > 0) {
        const organizerLinks = organizerIds.map((organizerId: string) => ({
          event_id: params.id,
          organizer_id: organizerId
        }));
        
        const { error: organizersError } = await supabaseAdmin
          .from('event_organizers')
          .insert(organizerLinks);
        
        if (organizersError) {
          console.error('Error updating organizers:', organizersError);
        }
      }
    }
    
    // Update speakers if provided
    if (speakerIds !== undefined) {
      // Delete existing speaker links
      await supabaseAdmin
        .from('event_speakers')
        .delete()
        .eq('event_id', params.id);
      
      // Add new speaker links
      if (speakerIds.length > 0) {
        const speakerLinks = speakerIds.map((speakerId: string) => ({
          event_id: params.id,
          speaker_id: speakerId
        }));
        
        const { error: speakersError } = await supabaseAdmin
          .from('event_speakers')
          .insert(speakerLinks);
        
        if (speakersError) {
          console.error('Error updating speakers:', speakersError);
        }
      }
    }
    
    // Fetch the updated event
    const { data, error: fetchError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (fetchError) {
      console.warn('Update succeeded but could not fetch updated event:', fetchError);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Delete event (cascade will handle relations)
    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
