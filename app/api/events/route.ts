import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/events route called');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('✅ Session found:', session.user.email);

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

    // Build query
    let query = supabaseAdmin
      .from('events_with_details')
      .select('*')
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
      console.error('❌ Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
    
    console.log('✅ Events fetched from database:', data?.length || 0);
    console.log('🔍 Sample event data:', data?.[0]);
    
    // Ensure all events have proper author information
    if (data && data.length > 0) {
      console.log('🔍 Processing events for author information:', data.length);
      
      // Get all unique author IDs that need lookup
      const authorIds = Array.from(new Set(data.map(event => event.author_id).filter(Boolean)));
      console.log('🔍 Author IDs found:', authorIds);
      
      let authorsMap = new Map();
      
      // Fetch author information for all unique author IDs
      if (authorIds.length > 0) {
        console.log('🔍 Fetching authors for IDs:', authorIds);
        const { data: authors, error: authorError } = await supabaseAdmin
          .from('users')
          .select('id, email, name')
          .in('id', authorIds);
        
        if (authorError) {
          console.error('❌ Error fetching authors:', authorError);
          console.warn('Could not fetch author information:', authorError.message);
        } else if (authors && authors.length > 0) {
          // Create a map for quick lookup
          authorsMap = new Map(authors.map(author => [author.id, author]));
          console.log('✅ Fetched authors:', authors.length);
          console.log('🔍 Authors data:', authors);
        } else {
          console.warn('⚠️ No authors found for IDs:', authorIds);
        }
      }
      
      data.forEach(event => {
        // PRIORITIZE ORIGINAL AUTHOR_NAME from events table
        if (event.author_name && event.author_name !== 'Unknown User') {
          // Best case: we have a valid author_name from the events table - USE THIS
          event.author = { 
            id: event.author_id || null, 
            email: event.author_id && authorsMap.has(event.author_id) ? authorsMap.get(event.author_id).email : null, 
            name: event.author_name  // PRESERVE THE ORIGINAL AUTHOR NAME
          };
          console.log('✅ Using original author_name for event:', event.title, 'Author:', event.author_name);
        } else if (event.author_id && authorsMap.has(event.author_id)) {
          // Fallback: we have author_id and found the author in database
          const author = authorsMap.get(event.author_id);
          event.author = { 
            id: author.id, 
            email: author.email, 
            name: author.name 
          };
          console.log('✅ Fallback to database author for event:', event.title, 'Author:', author.name);
        } else if (event.author_id) {
          // Problem case: we have author_id but couldn't find the author
          console.log('⚠️ Event has author_id but author not found in database:', event.title, 'author_id:', event.author_id);
          event.author = { 
            id: event.author_id, 
            email: null, 
            name: 'User (ID: ' + event.author_id.substring(0, 8) + '...)' 
          };
        } else {
          // Worst case: no author information at all
          console.log('⚠️ Event has no author information:', event.title);
          event.author = { 
            id: null, 
            email: null, 
            name: 'System User' 
          };
        }
      });
    }
    
    console.log('✅ Final events data with author info:', data?.length || 0);
    console.log('🔍 Sample final event:', data?.[0]);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in events API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
