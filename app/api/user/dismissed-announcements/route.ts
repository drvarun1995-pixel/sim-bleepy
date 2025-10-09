import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Retrieve user's dismissed announcements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's dismissed announcements
    const { data: user, error } = await supabase
      .from('users')
      .select('dismissed_announcements')
      .eq('email', session.user.email)
      .single();

    if (error) {
      console.error('Error fetching dismissed announcements:', error);
      return NextResponse.json({ error: 'Failed to fetch dismissed announcements' }, { status: 500 });
    }

    return NextResponse.json({ 
      dismissedAnnouncements: user?.dismissed_announcements || [] 
    });
  } catch (error) {
    console.error('Error in GET /api/user/dismissed-announcements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add an announcement to dismissed list
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { announcementId } = await request.json();

    if (!announcementId) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    // Get current dismissed announcements
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('dismissed_announcements')
      .eq('email', session.user.email)
      .single();

    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // Add the new announcement ID to the array (avoid duplicates)
    const currentDismissed = user?.dismissed_announcements || [];
    const updatedDismissed = Array.from(new Set([...currentDismissed, announcementId]));

    // Update the user's dismissed announcements
    const { error: updateError } = await supabase
      .from('users')
      .update({ dismissed_announcements: updatedDismissed })
      .eq('email', session.user.email);

    if (updateError) {
      console.error('Error updating dismissed announcements:', updateError);
      return NextResponse.json({ error: 'Failed to update dismissed announcements' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      dismissedAnnouncements: updatedDismissed 
    });
  } catch (error) {
    console.error('Error in POST /api/user/dismissed-announcements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove an announcement from dismissed list (for "undismiss" functionality)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { announcementId } = await request.json();

    if (!announcementId) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    // Get current dismissed announcements
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('dismissed_announcements')
      .eq('email', session.user.email)
      .single();

    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // Remove the announcement ID from the array
    const currentDismissed = user?.dismissed_announcements || [];
    const updatedDismissed = currentDismissed.filter((id: string) => id !== announcementId);

    // Update the user's dismissed announcements
    const { error: updateError } = await supabase
      .from('users')
      .update({ dismissed_announcements: updatedDismissed })
      .eq('email', session.user.email);

    if (updateError) {
      console.error('Error updating dismissed announcements:', updateError);
      return NextResponse.json({ error: 'Failed to update dismissed announcements' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      dismissedAnnouncements: updatedDismissed 
    });
  } catch (error) {
    console.error('Error in DELETE /api/user/dismissed-announcements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

