import { supabaseAdmin } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Count ARU students
    const { count: aruCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .or('university.ilike.%ARU%,university.ilike.%Anglia Ruskin%');

    // Count UCL students
    const { count: uclCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .or('university.ilike.%UCL%,university.ilike.%University College London%');

    // Count Foundation Year doctors
    const { count: fyCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .or('role_type.eq.foundation_doctor,foundation_year.not.is.null');

    // Get events for this month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: allEvents } = await supabaseAdmin
      .from('events')
      .select('id, title, date, categories')
      .gte('date', firstDay)
      .lte('date', lastDay);

    // Count events for ARU (events with ARU category)
    const aruEvents = allEvents?.filter(event => {
      const categoryNames = event.categories?.map((c: any) => c.name?.toLowerCase()).join(' ') || '';
      return categoryNames.includes('aru') || categoryNames.includes('anglia ruskin');
    }).length || 0;

    // Count events for UCL
    const uclEvents = allEvents?.filter(event => {
      const categoryNames = event.categories?.map((c: any) => c.name?.toLowerCase()).join(' ') || '';
      return categoryNames.includes('ucl') || categoryNames.includes('university college london');
    }).length || 0;

    // Count events for Foundation Year
    const fyEvents = allEvents?.filter(event => {
      const categoryNames = event.categories?.map((c: any) => c.name?.toLowerCase()).join(' ') || '';
      return categoryNames.includes('foundation') || categoryNames.includes('fy1') || categoryNames.includes('fy2');
    }).length || 0;

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

