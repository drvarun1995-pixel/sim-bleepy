import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';
import { NextRequest, NextResponse } from 'next/server';

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

    const eventId = params.id;

    // Fetch resources linked to this event
    const { data: linkedResources, error } = await supabaseAdmin
      .from('resource_events')
      .select(`
        resource_id,
        resources:resource_id (
          id,
          title,
          description,
          category,
          file_type,
          file_size,
          teaching_date,
          taught_by
        )
      `)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching linked resources:', error);
      return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }

    const resources = linkedResources?.map((lr: any) => lr.resources).filter(Boolean) || [];

    return NextResponse.json({ resources });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

