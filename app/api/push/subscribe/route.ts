import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function POST(request: NextRequest) {
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

    const { endpoint, keys, deviceInfo } = await request.json();

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const { data: existing } = await supabaseAdmin
      .from('user_push_subscriptions')
      .select('id')
      .eq('endpoint', endpoint)
      .maybeSingle();

    if (existing) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from('user_push_subscriptions')
        .update({
          user_id: user.id,
          p256dh: keys.p256dh,
          auth: keys.auth,
          device_info: deviceInfo || null,
          last_active_at: new Date().toISOString(),
          is_active: true,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, subscriptionId: existing.id });
    }

    // Create new subscription
    const { data: subscription, error: insertError } = await supabaseAdmin
      .from('user_push_subscriptions')
      .insert({
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        device_info: deviceInfo || null,
        is_active: true,
      })
      .select('id')
      .single();

    if (insertError || !subscription) {
      console.error('Error creating subscription:', insertError);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Create default preferences if they don't exist
    const { data: existingPrefs } = await supabaseAdmin
      .from('user_notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingPrefs) {
      await supabaseAdmin.from('user_notification_preferences').insert({
        user_id: user.id,
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
      success: true,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error('Error in subscribe endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

