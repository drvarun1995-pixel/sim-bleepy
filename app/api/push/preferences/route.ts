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

    // Get user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get preferences
    const { data: preferences, error } = await supabaseAdmin
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is okay
      console.error('Error fetching preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Return default preferences if none exist
    if (!preferences) {
      return NextResponse.json({
        teaching_events: true,
        bookings: true,
        certificates: true,
        feedback: true,
        announcements: true,
        leaderboard_updates: false,
        quiz_reminders: false,
      });
    }

    return NextResponse.json({
      teaching_events: preferences.teaching_events ?? true,
      bookings: preferences.bookings ?? true,
      certificates: preferences.certificates ?? true,
      feedback: preferences.feedback ?? true,
      announcements: preferences.announcements ?? true,
      leaderboard_updates: preferences.leaderboard_updates ?? false,
      quiz_reminders: preferences.quiz_reminders ?? false,
    });
  } catch (error) {
    console.error('Error in preferences GET endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const preferences = await request.json();

    // Check if preferences exist
    const { data: existing } = await supabaseAdmin
      .from('user_notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Update existing preferences
      const { error: updateError } = await supabaseAdmin
        .from('user_notification_preferences')
        .update({
          teaching_events: preferences.teaching_events ?? true,
          bookings: preferences.bookings ?? true,
          certificates: preferences.certificates ?? true,
          feedback: preferences.feedback ?? true,
          announcements: preferences.announcements ?? true,
          leaderboard_updates: preferences.leaderboard_updates ?? false,
          quiz_reminders: preferences.quiz_reminders ?? false,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating preferences:', updateError);
        return NextResponse.json(
          { error: 'Failed to update preferences' },
          { status: 500 }
        );
      }
    } else {
      // Create new preferences
      const { error: insertError } = await supabaseAdmin
        .from('user_notification_preferences')
        .insert({
          user_id: user.id,
          teaching_events: preferences.teaching_events ?? true,
          bookings: preferences.bookings ?? true,
          certificates: preferences.certificates ?? true,
          feedback: preferences.feedback ?? true,
          announcements: preferences.announcements ?? true,
          leaderboard_updates: preferences.leaderboard_updates ?? false,
          quiz_reminders: preferences.quiz_reminders ?? false,
        });

      if (insertError) {
        console.error('Error creating preferences:', insertError);
        return NextResponse.json(
          { error: 'Failed to create preferences' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in preferences PUT endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

