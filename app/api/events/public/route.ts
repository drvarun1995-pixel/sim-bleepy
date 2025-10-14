import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/events/public route called');
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category_id = searchParams.get('category_id');
    const format_id = searchParams.get('format_id');
    const location_id = searchParams.get('location_id');
    const organizer_id = searchParams.get('organizer_id');
    const event_status = searchParams.get('event_status');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    // Build query - only get published events for public access
    let query = supabaseAdmin
      .from('events_with_details')
      .select('*')
      .eq('status', 'published') // Only show published events to public
      .order('date', { ascending: false });

    if (status) query = query.eq('status', status);
    if (category_id) query = query.eq('category_id', category_id);
    if (format_id) query = query.eq('format_id', format_id);
    if (location_id) query = query.eq('location_id', location_id);
    if (organizer_id) query = query.eq('organizer_id', organizer_id);
    if (event_status) query = query.eq('event_status', event_status);
    if (start_date) query = query.gte('date', start_date);
    if (end_date) query = query.lte('date', end_date);

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching public events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
    
    console.log('✅ Public events fetched from database:', data?.length || 0);
    
    // Ensure all events have proper author information for public display
    if (data && data.length > 0) {
      console.log('🔍 Processing public events for author information:', data.length);
      
      data.forEach(event => {
        // For public access, show author name if available, otherwise show "System"
        if (event.author_name && event.author_name !== 'Unknown User') {
          event.author = { 
            id: event.author_id || null, 
            email: null, 
            name: event.author_name 
          };
          console.log('✅ Set author for public event:', event.title, 'Author:', event.author_name);
        } else {
          // For public access, show "System" instead of "Unknown User"
          event.author = { 
            id: null, 
            email: null, 
            name: 'System' 
          };
          console.log('✅ Set system author for public event:', event.title);
        }
      });
    }
    
    console.log('✅ Final public events data with author info:', data?.length || 0);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in public events API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
