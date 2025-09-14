import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
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
    
    // Admins have unlimited attempts
    if (isAdmin) {
      return NextResponse.json({ 
        canAttempt: true, 
        isAdmin: true,
        message: 'Admin users have unlimited attempts'
      });
    }

    // Ensure user exists in database first
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking user existence:', userError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // If user doesn't exist, they can attempt (first time user)
    if (!existingUser) {
      return NextResponse.json({
        canAttempt: true,
        isAdmin: false,
        hasAttemptedToday: false,
        attemptsToday: 0,
        message: 'You can start a consultation.'
      });
    }

    // Get today's date range (start and end of day in London timezone)
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
    
    console.log('Daily reset check (London timezone):', {
      userEmail: session.user.email,
      now: now.toISOString(),
      londonNow: londonNow.toISOString(),
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      startOfDayUTC: startOfDayUTC.toISOString(),
      endOfDayUTC: endOfDayUTC.toISOString()
    });
    
    // Check if user has any attempts today (using London timezone UTC equivalents)
    const { data: attempts, error } = await supabaseAdmin
      .from('attempts')
      .select('id, start_time')
      .eq('user_id', existingUser.id)
      .gte('start_time', startOfDayUTC.toISOString())
      .lt('start_time', endOfDayUTC.toISOString());

    if (error) {
      console.error('Error checking attempt limit:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const hasAttemptedToday = attempts && attempts.length > 0;
    
    console.log('Attempt check result:', {
      userEmail: session.user.email,
      attemptsFound: attempts?.length || 0,
      hasAttemptedToday,
      attempts: attempts?.map(a => ({ id: a.id, start_time: a.start_time }))
    });
    
    return NextResponse.json({
      canAttempt: !hasAttemptedToday,
      isAdmin: false,
      hasAttemptedToday,
      attemptsToday: attempts?.length || 0,
      message: hasAttemptedToday 
        ? 'You have already used your daily attempt. Try again tomorrow.'
        : 'You can start a consultation.',
      resetTime: endOfDay.toISOString(), // London timezone reset time
      resetTimeUTC: endOfDayUTC.toISOString() // UTC equivalent for reference
    });

  } catch (error) {
    console.error('Error in check-limit API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
