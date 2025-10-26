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
    
    // Get download counts for multiple resources using download_tracking table
    const { data: counts, error: countsError } = await supabaseAdmin
      .from('download_tracking')
      .select('resource_id')
      .in('resource_id', ids);

    if (countsError) {
      console.error('Error fetching download counts:', countsError);
      // If table doesn't exist yet, return zero counts
      const downloadCounts: Record<string, number> = {};
      ids.forEach((id) => {
        downloadCounts[id] = 0;
      });
      return NextResponse.json({ counts: downloadCounts });
    }

    console.log('Raw download data from database:', counts);

    // Count downloads per resource
    const downloadCounts: Record<string, number> = {};
    counts.forEach((download) => {
      const resourceId = download.resource_id;
      downloadCounts[resourceId] = (downloadCounts[resourceId] || 0) + 1;
    });

    // Ensure all requested IDs have a count (even if 0)
    ids.forEach((id) => {
      if (!(id in downloadCounts)) {
        downloadCounts[id] = 0;
      }
    });

    console.log('Processed download counts:', downloadCounts);

    return NextResponse.json({ counts: downloadCounts });
  } catch (error) {
    console.error('Error in download counts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
