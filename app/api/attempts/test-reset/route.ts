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

    // Check if user is admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    const isAdmin = adminEmails.includes(session.user.email.trim());
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get current time info (London timezone)
    const now = new Date();
    
    // Convert to London timezone
    const londonTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
    const londonOffset = now.getTimezoneOffset() - (londonTime.getTimezoneOffset() || 0);
    const londonNow = new Date(now.getTime() + (londonOffset * 60000));
    
    // Get start and end of day in London timezone
    const startOfDay = new Date(londonNow.getFullYear(), londonNow.getMonth(), londonNow.getDate());
    const endOfDay = new Date(londonNow.getFullYear(), londonNow.getMonth(), londonNow.getDate() + 1);
    
    // Convert back to UTC for database queries
    const startOfDayUTC = new Date(startOfDay.getTime() - (londonOffset * 60000));
    const endOfDayUTC = new Date(endOfDay.getTime() - (londonOffset * 60000));
    
    // Get all attempts for the user
    const { data: allAttempts, error } = await supabaseAdmin
      .from('attempts')
      .select('id, start_time, created_at')
      .eq('user_id', session.user.id)
      .order('start_time', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching attempts:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Get today's attempts (using London timezone UTC equivalents)
    const { data: todayAttempts, error: todayError } = await supabaseAdmin
      .from('attempts')
      .select('id, start_time')
      .eq('user_id', session.user.id)
      .gte('start_time', startOfDayUTC.toISOString())
      .lt('start_time', endOfDayUTC.toISOString());

    if (todayError) {
      console.error('Error fetching today attempts:', todayError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      timeInfo: {
        currentTime: now.toISOString(),
        currentTimeLocal: now.toString(),
        londonTime: londonNow.toISOString(),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
        startOfDayUTC: startOfDayUTC.toISOString(),
        endOfDayUTC: endOfDayUTC.toISOString(),
        timezoneOffset: now.getTimezoneOffset(),
        londonOffset: londonOffset,
        resetInHours: Math.round((endOfDay.getTime() - londonNow.getTime()) / (1000 * 60 * 60) * 100) / 100
      },
      attempts: {
        total: allAttempts?.length || 0,
        today: todayAttempts?.length || 0,
        recent: allAttempts?.slice(0, 5) || [],
        todayList: todayAttempts || []
      },
      resetStatus: {
        hasAttemptedToday: (todayAttempts?.length || 0) > 0,
        canAttempt: (todayAttempts?.length || 0) === 0,
        nextReset: endOfDay.toISOString(),
        nextResetUTC: endOfDayUTC.toISOString()
      }
    });

  } catch (error) {
    console.error('Error in test-reset API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
