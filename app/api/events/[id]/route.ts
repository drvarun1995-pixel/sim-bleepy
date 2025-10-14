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
