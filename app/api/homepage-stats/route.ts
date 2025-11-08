import { supabaseAdmin } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: studentUsers, error: studentsError } = await supabaseAdmin
      .from('users')
      .select('id, email, university, role_type, last_login')
      .eq('role', 'student')

    if (studentsError) {
      console.error('Failed to fetch student users:', studentsError)
      throw studentsError
    }

    const aruUsers: Array<{ id: string; last_login: string | null }> = []
    const uclUsers: Array<{ id: string; last_login: string | null }> = []
    const foundationUsers: Array<{ id: string; last_login: string | null }> = []

    const universityMatches = {
      aru: ['aru', 'anglia ruskin'],
      ucl: ['ucl', 'university college london'],
    }

    const inferUniversity = (email?: string | null): 'ARU' | 'UCL' | null => {
      if (!email) return null
      const lower = email.toLowerCase()
      if (lower.includes('@anglia.ac.uk') || lower.includes('@aru.ac.uk')) return 'ARU'
      if (lower.includes('@ucl.ac.uk')) return 'UCL'
      return null
    }

    const normalise = (value?: string | null) => value?.trim().toLowerCase() ?? null
    const activeThreshold = new Date()
    activeThreshold.setMonth(activeThreshold.getMonth() - 1)

    studentUsers?.forEach(user => {
      const university = normalise(user.university) ?? inferUniversity(user.email)?.toLowerCase() ?? null
      const lastLogin = user.last_login ?? null

      if (university) {
        if (universityMatches.aru.some(match => university.includes(match))) {
          aruUsers.push({ id: user.id, last_login: lastLogin })
        } else if (universityMatches.ucl.some(match => university.includes(match))) {
          uclUsers.push({ id: user.id, last_login: lastLogin })
        }
      }

      if (user.role_type && ['foundation_doctor', 'foundation_year'].includes(user.role_type)) {
        foundationUsers.push({ id: user.id, last_login: lastLogin })
      }
    })

    const isActive = (lastLogin: string | null) => {
      if (!lastLogin) return false
      return new Date(lastLogin) >= activeThreshold
    }

    const aruCount = aruUsers.length
    const aruActive = aruUsers.filter(user => isActive(user.last_login)).length
    const uclCount = uclUsers.length
    const uclActive = uclUsers.filter(user => isActive(user.last_login)).length
    const fyCount = foundationUsers.length
    const fyActive = foundationUsers.filter(user => isActive(user.last_login)).length

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
        activeStudents: aruActive || 0,
        eventsThisMonth: aruEvents
      },
      ucl: {
        studentCount: uclCount || 0,
        activeStudents: uclActive || 0,
        eventsThisMonth: uclEvents
      },
      foundationYear: {
        doctorCount: fyCount || 0,
        activeDoctors: fyActive || 0,
        eventsThisMonth: fyEvents
      }
    });

  } catch (error) {
    console.error('Homepage stats error:', error);
    // Return fallback data on error
    return NextResponse.json({
      aru: { studentCount: 0, activeStudents: 0, eventsThisMonth: 0 },
      ucl: { studentCount: 0, activeStudents: 0, eventsThisMonth: 0 },
      foundationYear: { doctorCount: 0, activeDoctors: 0, eventsThisMonth: 0 }
    });
  }
}

