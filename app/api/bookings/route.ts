import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings - Fetch user's bookings or all bookings (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get bookings first - ALWAYS filter out soft-deleted bookings for "My Bookings" page
    // Even admins should not see their own deleted bookings on this page
    let bookingsQuery = supabaseAdmin
      .from('event_bookings')
      .select('id, event_id, user_id, status, booked_at, deleted_at, cancelled_at, cancellation_reason')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    console.log('Fetching active bookings (excluding soft-deleted) for user:', user.id);

    const { data: bookings, error } = await bookingsQuery.order('booked_at', { ascending: false });
    console.log(`Fetched ${bookings?.length || 0} bookings for user:`, user.id);
    
    if (bookings && bookings.length > 0) {
      console.log('Sample booking deleted_at values:', bookings.map(b => ({ id: b.id, deleted_at: b.deleted_at })));
    }

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch bookings', 
        details: error 
      }, { status: 500 });
    }

    // Fetch event data separately if we have bookings
    if (bookings && bookings.length > 0) {
      const eventIds = bookings.map(b => b.event_id);
      const { data: events, error: eventsError } = await supabaseAdmin
        .from('events_with_details')
        .select('id, title, date, start_time, end_time, booking_capacity, booking_enabled, location_name, location_address')
        .in('id', eventIds);

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        // Return bookings without event details
        return NextResponse.json({ 
          success: true,
          bookings: bookings || [],
          count: bookings?.length || 0
        });
      }

      // Attach event data to bookings
      const bookingsWithEvents = bookings.map(booking => ({
        ...booking,
        events: events.find(e => e.id === booking.event_id)
      }));

      return NextResponse.json({ 
        success: true,
        bookings: bookingsWithEvents,
        count: bookingsWithEvents.length
      });
    }

    return NextResponse.json({ 
      success: true,
      bookings: bookings || [],
      count: bookings?.length || 0
    });
  } catch (error) {
    console.error('Error in GET /api/bookings:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/bookings - Create new booking
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      eventId, 
      confirmationCheckbox1Checked, 
      confirmationCheckbox2Checked,
      notes 
    } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get event details and check if booking is enabled
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select(`
        id,
        title,
        date,
        start_time,
        booking_enabled,
        booking_capacity,
        booking_deadline_hours,
        allow_waitlist,
        confirmation_checkbox_1_text,
        confirmation_checkbox_1_required,
        confirmation_checkbox_2_text,
        confirmation_checkbox_2_required,
        cancellation_deadline_hours,
        allowed_roles,
        approval_mode
      `)
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if booking is enabled for this event
    if (!event.booking_enabled) {
      return NextResponse.json({ 
        error: 'Booking is not enabled for this event' 
      }, { status: 400 });
    }

    // Check if user's categories are allowed to book
    if (event.allowed_roles && event.allowed_roles.length > 0) {
      // Get user profile to check their categories
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('role_type, university, study_year, foundation_year')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        return NextResponse.json({ 
          error: 'Unable to verify user profile for booking restrictions' 
        }, { status: 500 });
      }

      // Build user categories from profile data
      const userCategories: string[] = [];
      
      // Handle Medical Students
      if (userProfile.role_type === 'medical_student') {
        if (userProfile.university && userProfile.study_year) {
          const university = userProfile.university;
          const year = userProfile.study_year;
          
          // Add the specific year combination (e.g., "UCL Year 6")
          if (university === 'UCL') {
            userCategories.push(`UCL Year ${year}`);
            userCategories.push('UCL');
          } else if (university === 'ARU') {
            userCategories.push(`ARU Year ${year}`);
            userCategories.push('ARU');
          }
        }
      }
      
      // Handle Foundation Doctors
      if (userProfile.role_type === 'foundation_doctor' && userProfile.foundation_year) {
        const foundationYear = userProfile.foundation_year;
        
        // Add specific foundation year (e.g., "Foundation Year 1")
        if (foundationYear === 'FY1') {
          userCategories.push('Foundation Year 1');
        } else if (foundationYear === 'FY2') {
          userCategories.push('Foundation Year 2');
        }
        
        // Always add general foundation doctor category
        userCategories.push('Foundation Year Doctor');
      }
      
      // Handle other roles (Clinical Fellow, Specialty Doctor, Registrar)
      if (['clinical_fellow', 'specialty_doctor', 'registrar'].includes(userProfile.role_type)) {
        // These might be included in general categories or have their own
        // For now, we'll add them to a general category if needed
        userCategories.push('Clinical Staff');
      }
      
      // Debug logging
      console.log('🔍 Category Restriction Debug:');
      console.log('Full user profile:', userProfile);
      console.log('User categories (built from profile):', userCategories);
      console.log('Event allowed categories:', event.allowed_roles);
      
      // Try both exact match and case-insensitive match
      const hasMatchingCategory = event.allowed_roles.some((allowedCategory: string) => 
        userCategories.some((userCategory: string) => 
          userCategory === allowedCategory || 
          userCategory.toLowerCase() === allowedCategory.toLowerCase()
        )
      );
      
      console.log('Has matching category:', hasMatchingCategory);

      if (!hasMatchingCategory) {
        return NextResponse.json({ 
          error: `This event is restricted to specific categories: ${event.allowed_roles.join(', ')}. Your profile categories (${userCategories.join(', ')}) do not match the requirements.`,
          allowedCategories: event.allowed_roles,
          userCategories: userCategories
        }, { status: 403 });
      }
    }

    // Check if deadline has passed
    const now = new Date();
    const eventStart = new Date(`${event.date}T${event.start_time}`);
    // If deadline is 0, allow booking until event end time; else subtract hours from start
    const eventEnd = new Date(`${event.date}T${(event as any).end_time || event.start_time}`);
    const hours = Number(event.booking_deadline_hours) || 0;
    const deadline = hours === 0 ? eventEnd : new Date(eventStart.getTime() - (hours * 60 * 60 * 1000));
    
    if (now > deadline) {
      return NextResponse.json({ 
        error: hours === 0
          ? 'Booking deadline has passed (until event end)'
          : `Booking deadline has passed (${event.booking_deadline_hours} hours before event)` 
      }, { status: 400 });
    }

    // Check if user already has an active booking for this event (not cancelled)
    console.log('Checking for existing active booking for event:', eventId, 'user:', user.id);
    const { data: existingBooking, error: existingError } = await supabaseAdmin
      .from('event_bookings')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .maybeSingle();

    console.log('Existing booking check result:', { existingBooking, existingError });

    if (existingBooking) {
      console.log('Found existing active booking, rejecting new booking request');
      return NextResponse.json({ 
        error: 'You already have a booking for this event',
        existingBooking: { id: existingBooking.id, status: existingBooking.status }
      }, { status: 400 });
    }

    console.log('No existing active booking found, proceeding with booking creation');

    // Validate required checkboxes
    const checkbox1Required = event.confirmation_checkbox_1_required;
    const checkbox2Required = event.confirmation_checkbox_2_required && event.confirmation_checkbox_2_text;
    
    if (checkbox1Required && !confirmationCheckbox1Checked) {
      return NextResponse.json({ 
        error: 'First confirmation checkbox is required' 
      }, { status: 400 });
    }

    if (checkbox2Required && !confirmationCheckbox2Checked) {
      return NextResponse.json({ 
        error: 'Second confirmation checkbox is required' 
      }, { status: 400 });
    }

    // Check current booking count to determine status
    const { data: currentBookings, error: countError } = await supabaseAdmin
      .from('event_bookings')
      .select('id')
      .eq('event_id', eventId)
      .eq('status', 'confirmed');

    if (countError) {
      console.error('Error checking current bookings:', countError);
      return NextResponse.json({ error: 'Failed to check booking availability' }, { status: 500 });
    }

    const confirmedCount = currentBookings?.length || 0;
    let bookingStatus = 'confirmed';

    // Determine booking status based on approval mode first
    if (event.approval_mode === 'manual') {
      bookingStatus = 'pending';
    } else {
      // Auto-approve mode: determine status based on capacity
      if (event.booking_capacity && confirmedCount >= event.booking_capacity) {
        if (event.allow_waitlist) {
          bookingStatus = 'waitlist';
        } else {
          return NextResponse.json({ 
            error: 'This event is fully booked and no waitlist is available' 
          }, { status: 400 });
        }
      }
    }

    // Create the booking
    const { data: newBooking, error: createError } = await supabaseAdmin
      .from('event_bookings')
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: bookingStatus,
        confirmation_checkbox_1_checked: confirmationCheckbox1Checked || false,
        confirmation_checkbox_2_checked: confirmationCheckbox2Checked || false,
        notes: notes || null
      })
      .select(`
        id,
        event_id,
        status,
        booked_at,
        confirmation_checkbox_1_checked,
        confirmation_checkbox_2_checked,
        events (
          id,
          title,
          date,
          start_time,
          booking_capacity
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating booking:', createError);
      console.error('Booking data:', {
        event_id: eventId,
        user_id: user.id,
        status: bookingStatus,
        confirmation_checkbox_1_checked: confirmationCheckbox1Checked || false,
        confirmation_checkbox_2_checked: confirmationCheckbox2Checked || false,
        notes: notes || null
      });
      return NextResponse.json({ 
        error: 'Failed to create booking',
        details: createError.message,
        code: createError.code
      }, { status: 500 });
    }

    return NextResponse.json({ 
      booking: newBooking,
      message: bookingStatus === 'pending'
        ? 'Booking submitted! Waiting for admin approval.'
        : bookingStatus === 'confirmed' 
          ? 'Successfully booked for this event!' 
          : 'You have been added to the waitlist. We will notify you if a spot becomes available.'
    });

  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
