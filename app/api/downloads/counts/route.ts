import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceIds = searchParams.get('resourceIds');

    console.log('Download counts API called with resourceIds:', resourceIds);

    if (!resourceIds) {
      return NextResponse.json({ error: 'Missing resourceIds parameter' }, { status: 400 });
    }

    const ids = resourceIds.split(',');
    console.log('Processing resource IDs:', ids);
    
    // Get download counts for multiple resources using direct query
    const { data: counts, error: countsError } = await supabaseAdmin
      .from('download_tracking')
      .select('resource_id')
      .in('resource_id', ids);

    if (countsError) {
      console.error('Error fetching download counts:', countsError);
      return NextResponse.json({ error: 'Failed to fetch download counts' }, { status: 500 });
    }

    console.log('Raw download data from database:', counts);

    // Count downloads per resource
    const downloadCounts: Record<string, number> = {};
    counts.forEach((download) => {
      const resourceId = download.resource_id;
      downloadCounts[resourceId] = (downloadCounts[resourceId] || 0) + 1;
    });

    console.log('Processed download counts:', downloadCounts);

    return NextResponse.json({ counts: downloadCounts });
  } catch (error) {
    console.error('Error in download counts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
