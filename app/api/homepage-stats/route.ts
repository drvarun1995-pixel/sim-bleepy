import { supabaseAdmin } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Static student/doctor counts (not enough real data yet)
    const aruCount = 85;
    const uclCount = 92;
    const fyCount = 56;

    // Get events for this month using the view
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: allEvents } = await supabaseAdmin
      .from('events_with_details')
      .select('id, title, date, categories')
      .gte('date', firstDay)
      .lte('date', lastDay);

    console.log('Total events this month:', allEvents?.length);
    console.log('Sample event categories:', allEvents?.[0]?.categories);

    // Count events for ARU (events with ARU category)
    const aruEvents = allEvents?.filter(event => {
      if (!event.categories || !Array.isArray(event.categories)) return false;
      return event.categories.some((cat: any) => {
        const name = cat.name?.toLowerCase() || '';
        return name.includes('aru') || name.includes('anglia ruskin');
      });
    }).length || 0;

    // Count events for UCL
    const uclEvents = allEvents?.filter(event => {
      if (!event.categories || !Array.isArray(event.categories)) return false;
      return event.categories.some((cat: any) => {
        const name = cat.name?.toLowerCase() || '';
        return name.includes('ucl') || name.includes('university college london');
      });
    }).length || 0;

    // Count events for Foundation Year
    const fyEvents = allEvents?.filter(event => {
      if (!event.categories || !Array.isArray(event.categories)) return false;
      return event.categories.some((cat: any) => {
        const name = cat.name?.toLowerCase() || '';
        return name.includes('foundation') || name.includes('fy1') || name.includes('fy2');
      });
    }).length || 0;

    console.log('ARU events:', aruEvents, 'UCL events:', uclEvents, 'FY events:', fyEvents);

    return NextResponse.json({
      aru: {
        studentCount: aruCount || 0,
        eventsThisMonth: aruEvents
      },
      ucl: {
        studentCount: uclCount || 0,
        eventsThisMonth: uclEvents
      },
      foundationYear: {
        doctorCount: fyCount || 0,
        eventsThisMonth: fyEvents
      }
    });

  } catch (error) {
    console.error('Homepage stats error:', error);
    // Return fallback data on error
    return NextResponse.json({
      aru: { studentCount: 0, eventsThisMonth: 0 },
      ucl: { studentCount: 0, eventsThisMonth: 0 },
      foundationYear: { doctorCount: 0, eventsThisMonth: 0 }
    });
  }
}

