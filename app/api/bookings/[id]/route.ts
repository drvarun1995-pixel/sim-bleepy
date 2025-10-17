import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/[id] - Get specific booking details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;

    // Get user info to check role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = ['admin', 'meded_team', 'ctf', 'educator'].includes(user.role);

    // Fetch booking with event and user details
    const { data: booking, error } = await supabaseAdmin
      .from('event_bookings')
      .select(`
        id,
        event_id,
        user_id,
        status,
        booked_at,
        cancelled_at,
        cancellation_reason,
        checked_in,
        checked_in_at,
        confirmation_checkbox_1_checked,
        confirmation_checkbox_2_checked,
        notes,
        created_at,
        updated_at,
        events (
          id,
          title,
          date,
          start_time,
          end_time,
          location_name,
          location_address,
          booking_capacity,
          booking_enabled,
          booking_button_label
        ),
        users (
          id,
          name,
          email,
          role
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if user can access this booking
    if (!isAdmin && booking.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Error in GET /api/bookings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/bookings/[id] - Update booking (cancel, mark attended, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;
    const body = await request.json();
    const { 
      status, 
      cancellation, 
      notes,
      checked_in 
    } = body;

    // Get user info to check role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = ['admin', 'meded_team', 'ctf', 'educator'].includes(user.role);

    // Get current booking with event details including cancellation deadline
    const { data: currentBooking, error: fetchError } = await supabaseAdmin
      .from('event_bookings')
      .select(`
        id,
        user_id,
        status,
        event_id,
        events (
          id,
          title,
          date,
          start_time,
          cancellation_deadline_hours
        )
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !currentBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if user can update this booking
    if (!isAdmin && currentBooking.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};

    // Regular users can only cancel their own bookings
    if (!isAdmin) {
      if (status && status !== 'cancelled') {
        return NextResponse.json({ 
          error: 'You can only cancel your own bookings' 
        }, { status: 403 });
      }
      if (status === 'cancelled') {
        // Check cancellation deadline for regular users
        const eventData = currentBooking.events as any;
        if (eventData && eventData.cancellation_deadline_hours > 0) {
          const eventDateTime = new Date(`${eventData.date}T${eventData.start_time}`);
          const now = new Date();
          const hoursUntilEvent = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          if (hoursUntilEvent < eventData.cancellation_deadline_hours) {
            return NextResponse.json({ 
              error: `Cannot cancel within ${eventData.cancellation_deadline_hours} hours of the event. Please contact the event organizer for assistance.` 
            }, { status: 400 });
          }
        }
        
        updateData.status = 'cancelled';
        updateData.cancelled_at = new Date().toISOString();
        if (cancellation) {
          updateData.cancellation_reason = cancellation;
        }
      }
    } else {
      // Admins can update any booking field
      if (status) updateData.status = status;
      if (cancellation !== undefined) updateData.cancellation_reason = cancellation;
      if (notes !== undefined) updateData.notes = notes;
      if (checked_in !== undefined) {
        updateData.checked_in = checked_in;
        if (checked_in) {
          updateData.checked_in_at = new Date().toISOString();
        } else {
          updateData.checked_in_at = null;
        }
      }
      
      // Set cancelled_at when cancelling
      if (status === 'cancelled' && currentBooking.status !== 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }
    }

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('event_bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select(`
        id,
        event_id,
        user_id,
        status,
        booked_at,
        cancelled_at,
        cancellation_reason,
        checked_in,
        checked_in_at,
        confirmation_checkbox_1_checked,
        confirmation_checkbox_2_checked,
        notes,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      console.error('Update data:', updateData);
      console.error('Booking ID:', bookingId);
      return NextResponse.json({ 
        error: 'Failed to update booking', 
        details: updateError,
        updateData,
        bookingId 
      }, { status: 500 });
    }

    // If booking was confirmed and now cancelled, promote someone from waitlist
    if (isAdmin && currentBooking.status === 'confirmed' && status === 'cancelled') {
      await promoteWaitlistUser(currentBooking.event_id);
    }

    return NextResponse.json({ 
      booking: updatedBooking,
      message: getUpdateMessage(status, checked_in)
    });

  } catch (error) {
    console.error('Error in PUT /api/bookings/[id]:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/bookings/[id] - Delete booking (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = ['admin', 'meded_team', 'ctf', 'educator'].includes(user.role);

    // Get the booking to check ownership
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('event_bookings')
      .select('user_id')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Users can only delete their own bookings, admins can permanently delete any
    if (!isAdmin && booking.user_id !== user.id) {
      return NextResponse.json({ 
        error: 'You can only delete your own bookings' 
      }, { status: 403 });
    }

    // Soft delete for users (mark as deleted but keep record)
    // Hard delete for admins (if explicitly requested via query param)
    const hardDelete = isAdmin && new URL(request.url).searchParams.get('hard') === 'true';

    if (hardDelete) {
      // Permanent deletion (admin only)
      const { error: deleteError } = await supabaseAdmin
        .from('event_bookings')
        .delete()
        .eq('id', bookingId);

      if (deleteError) {
        console.error('Error permanently deleting booking:', deleteError);
        return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Booking permanently deleted' 
      });
    } else {
      // Soft delete (mark as deleted)
      console.log('Soft deleting booking:', bookingId, 'by user:', user.id);
      const { error: updateError } = await supabaseAdmin
        .from('event_bookings')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Error soft deleting booking:', updateError);
        return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
      }

      console.log('Booking soft deleted successfully:', bookingId);
      return NextResponse.json({ 
        message: 'Booking deleted successfully' 
      });
    }

  } catch (error) {
    console.error('Error in DELETE /api/bookings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Helper function to promote waitlist user when someone cancels
 */
async function promoteWaitlistUser(eventId: string) {
  try {
    // Get the first waitlist booking
    const { data: waitlistBooking, error: fetchError } = await supabaseAdmin
      .from('event_bookings')
      .select('id')
      .eq('event_id', eventId)
      .eq('status', 'waitlist')
      .order('booked_at', { ascending: true })
      .limit(1)
      .single();

    if (waitlistBooking) {
      // Promote to confirmed
      const { error: promoteError } = await supabaseAdmin
        .from('event_bookings')
        .update({ status: 'confirmed' })
        .eq('id', waitlistBooking.id);

      if (promoteError) {
        console.error('Error promoting waitlist booking:', promoteError);
      }
    }
  } catch (error) {
    console.error('Error in promoteWaitlistUser:', error);
  }
}

/**
 * Helper function to generate update message
 */
function getUpdateMessage(status?: string, checkedIn?: boolean): string {
  if (status === 'cancelled') return 'Booking cancelled successfully';
  if (status === 'attended') return 'Marked as attended';
  if (status === 'no-show') return 'Marked as no-show';
  if (checkedIn === true) return 'Check-in recorded';
  if (checkedIn === false) return 'Check-in removed';
  return 'Booking updated successfully';
}

