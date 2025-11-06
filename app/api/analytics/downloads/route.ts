import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or meded_team
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user || (user.role !== 'admin' && user.role !== 'meded_team')) {
      return NextResponse.json({ error: 'Admin or MedEd Team access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const resourceId = searchParams.get('resourceId');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

    // Build base query
    let query = supabaseAdmin
      .from('download_tracking')
      .select(`
        id,
        resource_id,
        resource_name,
        user_email,
        user_name,
        file_type,
        file_size,
        download_method,
        download_status,
        download_timestamp,
        created_at,
        resources!inner(
          id,
          title,
          category
        )
      `)
      .order('download_timestamp', { ascending: false });

    // Apply filters
    if (startDate) {
      query = query.gte('download_timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('download_timestamp', endDate);
    }
    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }

    const { data: downloads, error } = await query;

    if (error) {
      console.error('Error fetching download analytics:', error);
      return NextResponse.json({ error: 'Failed to fetch download analytics' }, { status: 500 });
    }

    // Calculate analytics
    const totalDownloads = downloads?.length || 0;
    const uniqueUsers = new Set(downloads?.map(d => d.user_email).filter(Boolean)).size;
    const totalFileSize = downloads?.reduce((sum, d) => sum + (d.file_size || 0), 0) || 0;

    // Group by file type
    const downloadsByType = downloads?.reduce((acc, d) => {
      const type = d.file_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Group by category
    const downloadsByCategory = downloads?.reduce((acc, d) => {
      const category = (d.resources as any)?.category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Group by time period
    const downloadsByTime = downloads?.reduce((acc, d) => {
      const date = new Date(d.download_timestamp);
      let key: string;
      
      switch (groupBy) {
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default: // day
          key = date.toISOString().split('T')[0];
      }
      
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Top downloaded resources
    const topResources = downloads?.reduce((acc, d) => {
      const resourceId = d.resource_id;
      if (!acc[resourceId]) {
        acc[resourceId] = {
          id: resourceId,
          title: d.resource_name,
          category: (d.resources as any)?.category,
          downloads: 0,
          totalSize: 0
        };
      }
      acc[resourceId].downloads += 1;
      acc[resourceId].totalSize += d.file_size || 0;
      return acc;
    }, {} as Record<string, any>) || {};

    const topResourcesArray = Object.values(topResources)
      .sort((a: any, b: any) => b.downloads - a.downloads)
      .slice(0, 10);

    // Recent downloads
    const recentDownloads = downloads?.slice(0, 20).map(d => ({
      id: d.id,
      resourceName: d.resource_name,
      userEmail: d.user_email,
      userName: d.user_name,
      fileType: d.file_type,
      fileSize: d.file_size,
      downloadTimestamp: d.download_timestamp,
      category: (d.resources as any)?.category
    })) || [];

    return NextResponse.json({
      summary: {
        totalDownloads,
        uniqueUsers,
        totalFileSize,
        averageFileSize: totalDownloads > 0 ? Math.round(totalFileSize / totalDownloads) : 0
      },
      breakdown: {
        byFileType: downloadsByType,
        byCategory: downloadsByCategory,
        byTime: downloadsByTime
      },
      topResources: topResourcesArray,
      recentDownloads,
      period: {
        startDate,
        endDate,
        groupBy
      }
    });

  } catch (error) {
    console.error('Error in download analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
