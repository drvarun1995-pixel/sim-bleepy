import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';
import { hasUnlimitedAttempts, getRoleDisplayName } from '@/lib/roles';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role from database
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    // Handle database errors first (except "no rows" error)
    if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking user existence:', userError);
      return NextResponse.json({ error: 'Database error', details: userError.message }, { status: 500 });
    }

    // Only Admins have unlimited attempts
    if (existingUser && hasUnlimitedAttempts(existingUser.role)) {
      return NextResponse.json({ 
        canAttempt: true, 
        isAdmin: true,
        role: existingUser.role,
        message: 'Admin users have unlimited attempts'
      });
    }

    // Fallback: Check environment variable for admin emails (for initial setup)
    if (!existingUser) {
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
      const isAdmin = adminEmails.includes(session.user.email.trim());
      
      if (isAdmin) {
        return NextResponse.json({ 
          canAttempt: true, 
          isAdmin: true,
          message: 'Admin users have unlimited attempts'
        });
      }
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

    const attemptsToday = attempts?.length || 0;
    const maxAttemptsPerDay = 3;
    const hasReachedLimit = attemptsToday >= maxAttemptsPerDay;
    
    console.log('Attempt check result:', {
      userEmail: session.user.email,
      attemptsFound: attempts?.length || 0,
      hasAttemptedToday: attemptsToday > 0,
      hasReachedLimit,
      attempts: attempts?.map(a => ({ id: a.id, start_time: a.start_time }))
    });
    
    return NextResponse.json({
      canAttempt: !hasReachedLimit,
      isAdmin: false,
      hasAttemptedToday: attemptsToday > 0,
      attemptsToday: attemptsToday,
      attemptsRemaining: Math.max(0, maxAttemptsPerDay - attemptsToday),
      maxAttemptsPerDay: maxAttemptsPerDay,
      message: hasReachedLimit
        ? `You have used all ${maxAttemptsPerDay} daily attempts. Try again tomorrow.`
        : attemptsToday === 0
        ? 'You can start a consultation.'
        : `You have ${maxAttemptsPerDay - attemptsToday} attempts remaining today.`,
      resetTime: endOfDay.toISOString(), // London timezone reset time
      resetTimeUTC: endOfDayUTC.toISOString() // UTC equivalent for reference
    });

  } catch (error) {
    console.error('Error in check-limit API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
