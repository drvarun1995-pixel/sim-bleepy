import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';
import { updateCronTasksForEvent } from '@/lib/cron-tasks';
const EVENTS_BUCKET = 'events';

const sanitizeSlug = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const slug = value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return slug || null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('events_with_details')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error) {
      console.error('Error fetching event:', error);
      return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }
    
    // Ensure event has proper author information
    if (data) {
      if (data.author_name) {
        data.author = { 
          id: data.author_id || null, 
          email: null, 
          name: data.author_name 
        };
        console.log('✅ Set author for event:', data.title, 'Author:', data.author_name);
      } else if (data.author_id) {
        // Try to fetch author information from database
        try {
          console.log('🔍 Fetching author for ID:', data.author_id);
          const { data: author, error: authorError } = await supabaseAdmin
            .from('users')
            .select('id, email, name')
            .eq('id', data.author_id)
            .single();
          
          if (!authorError && author) {
            data.author = { 
              id: author.id, 
              email: author.email, 
              name: author.name 
            };
            console.log('✅ Set author from database for event:', data.title, 'Author:', author.name);
          } else {
            console.error('❌ Error fetching author:', authorError);
            console.log('⚠️ Event has author_id but author not found in database:', data.title, 'author_id:', data.author_id);
            data.author = { 
              id: data.author_id, 
              email: null, 
              name: 'Unknown User' 
            };
          }
        } catch (error) {
          console.warn('Error fetching author for event:', error);
          data.author = { 
            id: data.author_id, 
            email: null, 
            name: 'Unknown User' 
          };
        }
      } else {
        console.log('⚠️ Event has no author information:', data.title);
        data.author = { 
          id: null, 
          email: null, 
          name: 'Unknown User' 
        };
      }
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in event API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update event with all relations
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check user role
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();
    
    if (!user || !['admin', 'educator', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }
    
    // Get request data
    const updates = await request.json();
    
    // Get the previous event to check if status changed
    const { data: previousEvent } = await supabaseAdmin
      .from('events')
      .select('event_status, allowed_roles, title, rescheduled_date, moved_online_link')
      .eq('id', params.id)
      .single();
    
    // Extract relation IDs
    const speakerIds = updates.speaker_ids;
    const categoryIds = updates.category_ids;
    const locationIds = updates.location_ids;
    const organizerIds = updates.organizer_ids;
    
    // Remove relation arrays from event data
    const cleanUpdates = { ...updates };
    delete cleanUpdates.speaker_ids;
    delete cleanUpdates.category_ids;
    delete cleanUpdates.location_ids;
    delete cleanUpdates.organizer_ids;
    
    // Update event
    const { error: updateError } = await supabaseAdmin
      .from('events')
      .update(cleanUpdates)
      .eq('id', params.id);
    
    if (updateError) {
      console.error('Error updating event:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    // Update categories if provided
    if (categoryIds !== undefined) {
      // Delete existing category links
      await supabaseAdmin
        .from('event_categories')
        .delete()
        .eq('event_id', params.id);
      
      // Add new category links
      if (categoryIds.length > 0) {
        const categoryLinks = categoryIds.map((categoryId: string) => ({
          event_id: params.id,
          category_id: categoryId
        }));
        
        const { error: categoriesError } = await supabaseAdmin
          .from('event_categories')
          .insert(categoryLinks);
        
        if (categoriesError) {
          console.error('Error updating categories:', categoriesError);
        }
      }
    }
    
    // Update locations if provided
    if (locationIds !== undefined) {
      // Delete existing location links
      await supabaseAdmin
        .from('event_locations')
        .delete()
        .eq('event_id', params.id);
      
      // Add new location links
      if (locationIds.length > 0) {
        const locationLinks = locationIds.map((locationId: string) => ({
          event_id: params.id,
          location_id: locationId
        }));
        
        const { error: locationsError } = await supabaseAdmin
          .from('event_locations')
          .insert(locationLinks);
        
        if (locationsError) {
          console.error('Error updating locations:', locationsError);
        }
      }
    }
    
    // Update organizers if provided
    if (organizerIds !== undefined) {
      // Delete existing organizer links
      await supabaseAdmin
        .from('event_organizers')
        .delete()
        .eq('event_id', params.id);
      
      // Add new organizer links
      if (organizerIds.length > 0) {
        const organizerLinks = organizerIds.map((organizerId: string) => ({
          event_id: params.id,
          organizer_id: organizerId
        }));
        
        const { error: organizersError } = await supabaseAdmin
          .from('event_organizers')
          .insert(organizerLinks);
        
        if (organizersError) {
          console.error('Error updating organizers:', organizersError);
        }
      }
    }
    
    // Update speakers if provided
    if (speakerIds !== undefined) {
      // Delete existing speaker links
      await supabaseAdmin
        .from('event_speakers')
        .delete()
        .eq('event_id', params.id);
      
      // Add new speaker links
      if (speakerIds.length > 0) {
        const speakerLinks = speakerIds.map((speakerId: string) => ({
          event_id: params.id,
          speaker_id: speakerId
        }));
        
        const { error: speakersError } = await supabaseAdmin
          .from('event_speakers')
          .insert(speakerLinks);
        
        if (speakersError) {
          console.error('Error updating speakers:', speakersError);
        }
      }
    }
    
    // Fetch the updated event
    const { data, error: fetchError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (fetchError) {
      console.warn('Update succeeded but could not fetch updated event:', fetchError);
      return NextResponse.json({ success: true });
    }
    
    // Handle feedback forms lifecycle based on feedback_enabled toggle
    if (Object.prototype.hasOwnProperty.call(cleanUpdates, 'feedback_enabled')) {
      const feedbackEnabled = !!cleanUpdates.feedback_enabled
      if (!feedbackEnabled) {
        // Delete all feedback forms for this event when disabling feedback
        try {
          await supabaseAdmin
            .from('feedback_forms')
            .delete()
            .eq('event_id', params.id)
        } catch (e) {
          console.error('Failed to delete feedback forms on disable:', e)
        }
      } else {
        // When enabling feedback, do NOT auto-create a default form here.
        // The UI explicitly creates/replaces a form when the user selects a template.
        try {
          const { data: existingForms } = await supabaseAdmin
            .from('feedback_forms')
            .select('id, created_at')
            .eq('event_id', params.id)
            .eq('active', true)
            .order('created_at', { ascending: false })

          if (existingForms && existingForms.length > 1) {
            // Keep the most recent active, deactivate the rest
            const extraIds = existingForms.slice(1).map((f: any) => f.id)
            await supabaseAdmin
              .from('feedback_forms')
              .update({ active: false })
              .in('id', extraIds)
          }
        } catch (e) {
          console.error('Failed to normalize feedback forms on enable:', e)
        }
      }
    }

    // Handle QR code lifecycle
    if (Object.prototype.hasOwnProperty.call(cleanUpdates, 'qr_attendance_enabled') && !cleanUpdates.qr_attendance_enabled) {
      // QR disabled: deactivate records and delete images from storage
      try {
        const { data: qrRows } = await supabaseAdmin
          .from('event_qr_codes')
          .select('id, qr_code_image_url, active')
          .eq('event_id', params.id)

        if (qrRows && qrRows.length > 0) {
          // Deactivate all
          await supabaseAdmin
            .from('event_qr_codes')
            .update({ active: false })
            .eq('event_id', params.id)

          // Collect storage paths and remove
          const paths: string[] = []
          for (const row of qrRows) {
            const url: string | null = row.qr_code_image_url
            if (!url) continue
            const idx = url.indexOf('/qr-codes/')
            if (idx !== -1) {
              const path = url.substring(idx + '/qr-codes/'.length)
              if (path) paths.push(path)
            }
          }
          if (paths.length > 0) {
            await supabaseAdmin.storage.from('qr-codes').remove(paths)
          }
        }
      } catch (e) {
        console.error('Failed to clean up QR codes on disable:', e)
      }
    }

    // Auto-generate QR code if QR attendance is enabled
    if (cleanUpdates.qr_attendance_enabled) {
      try {
        console.log('🎯 Auto-generating QR code for updated event:', params.id);
        console.log('🎯 Event QR attendance enabled:', cleanUpdates.qr_attendance_enabled);
        
        const qrResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/qr-codes/auto-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: params.id
          })
        });

        console.log('🎯 QR response status:', qrResponse.status);
        
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          console.log('✅ QR code auto-generated successfully:', qrData.qrCode?.id);
        } else {
          const errorText = await qrResponse.text();
          console.error('❌ Failed to auto-generate QR code:', qrResponse.status, errorText);
        }
      } catch (qrError) {
        console.error('❌ Error auto-generating QR code:', qrError);
        // Don't fail the event update if QR generation fails
      }
    }
    
    // Update cron tasks for this event
    try {
      const cronResult = await updateCronTasksForEvent(params.id, {
        date: data.date,
        end_time: data.end_time,
        start_time: data.start_time,
        booking_enabled: data.booking_enabled,
        feedback_enabled: data.feedback_enabled,
        auto_generate_certificate: data.auto_generate_certificate,
        certificate_template_id: data.certificate_template_id
      })
      console.log('📅 Cron tasks update result:', cronResult)
    } catch (cronError) {
      console.error('Error updating cron tasks:', cronError)
      // Don't fail event update if cron task update fails
    }
    
    // Create announcement if event status changed to postponed, cancelled, rescheduled, or moved-online
    let announcementCreated = false;
    let announcementStatus = '';
    
    if (cleanUpdates.event_status && previousEvent) {
      const newStatus = cleanUpdates.event_status;
      const oldStatus = previousEvent.event_status;
      
      if (oldStatus !== newStatus && (newStatus === 'postponed' || newStatus === 'cancelled' || newStatus === 'rescheduled' || newStatus === 'moved-online')) {
        try {
          console.log(`📢 Event status changed to ${newStatus}, creating announcement...`);
          announcementStatus = newStatus;
          
          // Get user ID for announcement author
          const { data: authorUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();
          
          if (!authorUser) {
            console.error('Could not find user for announcement author');
          } else {
            // Get event categories from allowed_roles
            const allowedRoles = data.allowed_roles || previousEvent.allowed_roles || [];
            
            // Map event categories to announcement target audience
            const universities: string[] = [];
            const years: string[] = [];
            const roles: string[] = [];
            
            // Check if we have any medical student categories
            let hasMedicalStudentCategories = false;
            let hasFoundationDoctorCategories = false;
            
            allowedRoles.forEach((category: string) => {
              // Check for university names
              if (category === 'ARU' || category === 'UCL') {
                if (!universities.includes(category)) {
                  universities.push(category);
                }
                hasMedicalStudentCategories = true;
              }
              // Check for year-specific categories (e.g., "ARU Year 5", "UCL Year 6")
              else if (category.includes('ARU Year') || category.includes('UCL Year')) {
                hasMedicalStudentCategories = true;
                // Extract university
                if (category.includes('ARU Year')) {
                  if (!universities.includes('ARU')) {
                    universities.push('ARU');
                  }
                  // Extract year number (e.g., "ARU Year 5" -> "5")
                  const yearMatch = category.match(/Year (\d+)/);
                  if (yearMatch && yearMatch[1]) {
                    const year = yearMatch[1];
                    if (!years.includes(year)) {
                      years.push(year);
                    }
                  }
                } else if (category.includes('UCL Year')) {
                  if (!universities.includes('UCL')) {
                    universities.push('UCL');
                  }
                  // Extract year number
                  const yearMatch = category.match(/Year (\d+)/);
                  if (yearMatch && yearMatch[1]) {
                    const year = yearMatch[1];
                    if (!years.includes(year)) {
                      years.push(year);
                    }
                  }
                }
              }
              // Check for Foundation Year Doctor categories
              else if (category === 'Foundation Year Doctor') {
                hasFoundationDoctorCategories = true;
                if (!roles.includes('foundation_doctor')) {
                  roles.push('foundation_doctor');
                }
              }
              // Check for Foundation Year 1 or FY1
              else if (category === 'Foundation Year 1' || category === 'FY1') {
                hasFoundationDoctorCategories = true;
                if (!roles.includes('foundation_doctor')) {
                  roles.push('foundation_doctor');
                }
                if (!years.includes('FY1')) {
                  years.push('FY1');
                }
              }
              // Check for Foundation Year 2 or FY2
              else if (category === 'Foundation Year 2' || category === 'FY2') {
                hasFoundationDoctorCategories = true;
                if (!roles.includes('foundation_doctor')) {
                  roles.push('foundation_doctor');
                }
                if (!years.includes('FY2')) {
                  years.push('FY2');
                }
              }
            });
            
            // Add medical_student role if we have university categories
            if (hasMedicalStudentCategories && !roles.includes('medical_student')) {
              roles.push('medical_student');
            }
            
            // Determine target audience type
            const targetAudienceType = (universities.length > 0 || years.length > 0 || roles.length > 0) 
              ? 'specific' 
              : 'all';
            
            // Get updated event data to check rescheduled_date, moved_online_link, date, and title
            const { data: updatedEvent } = await supabaseAdmin
              .from('events')
              .select('rescheduled_date, moved_online_link, title, date')
              .eq('id', params.id)
              .single();
            
            // Get event date (original date, not rescheduled)
            const eventDate = (updates.date as string | undefined) || updatedEvent?.date || previousEvent?.date;
            let eventDateFormatted = '';
            if (eventDate) {
              const date = new Date(eventDate);
              eventDateFormatted = date.toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
            }
            
            // Format rescheduled date if provided
            let rescheduledDateFormatted = '';
            const rescheduledDate = (updates.rescheduled_date as string | undefined) || updatedEvent?.rescheduled_date || previousEvent?.rescheduled_date;
            if (rescheduledDate) {
              const date = new Date(rescheduledDate);
              rescheduledDateFormatted = date.toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
            }
            
            // Get moved online link
            const movedOnlineLink = cleanUpdates.moved_online_link || updatedEvent?.moved_online_link || previousEvent?.moved_online_link;
            const eventTitle = data.title || updatedEvent?.title || previousEvent.title;
            
            // Get base URL for event link
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                           (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
            const eventUrl = `${baseUrl}/events/${params.id}`;
            
            // Create announcement title and content based on status
            let announcementTitle = '';
            let announcementContent = '';
            
            if (newStatus === 'postponed') {
              announcementTitle = `Event Postponed: ${eventTitle}`;
              const eventDateText = eventDateFormatted ? ` (originally scheduled for ${eventDateFormatted})` : '';
              announcementContent = `The event <a href="${eventUrl}" style="color: #007bff; text-decoration: underline;">"${eventTitle}"</a>${eventDateText} has been postponed. Please check back for updates on the new date and time.`;
            } else if (newStatus === 'cancelled') {
              announcementTitle = `Event Cancelled: ${eventTitle}`;
              const eventDateText = eventDateFormatted ? ` (originally scheduled for ${eventDateFormatted})` : '';
              announcementContent = `The event <a href="${eventUrl}" style="color: #007bff; text-decoration: underline;">"${eventTitle}"</a>${eventDateText} has been cancelled. We apologize for any inconvenience.`;
            } else if (newStatus === 'rescheduled') {
              if (rescheduledDateFormatted) {
                announcementTitle = `Event Rescheduled: ${eventTitle}`;
                const eventDateText = eventDateFormatted ? ` (originally scheduled for ${eventDateFormatted})` : '';
                announcementContent = `The event <a href="${eventUrl}" style="color: #007bff; text-decoration: underline;">"${eventTitle}"</a>${eventDateText} has been rescheduled to ${rescheduledDateFormatted}. Please update your calendar accordingly.`;
              } else {
                announcementTitle = `Event Rescheduled: ${eventTitle}`;
                const eventDateText = eventDateFormatted ? ` (originally scheduled for ${eventDateFormatted})` : '';
                announcementContent = `The event <a href="${eventUrl}" style="color: #007bff; text-decoration: underline;">"${eventTitle}"</a>${eventDateText} has been rescheduled. Please check back for updates on the new date and time.`;
              }
            } else if (newStatus === 'moved-online') {
              announcementTitle = `Event Moved Online: ${eventTitle}`;
              const eventDateText = eventDateFormatted ? ` (originally scheduled for ${eventDateFormatted})` : '';
              if (movedOnlineLink) {
                announcementContent = `The event <a href="${eventUrl}" style="color: #007bff; text-decoration: underline;">"${eventTitle}"</a>${eventDateText} has been moved online. Join the event here: ${movedOnlineLink}`;
              } else {
                announcementContent = `The event <a href="${eventUrl}" style="color: #007bff; text-decoration: underline;">"${eventTitle}"</a>${eventDateText} has been moved online. Please check the event page for the online meeting link.`;
              }
            }
            
            const targetAudience = {
              type: targetAudienceType,
              roles: roles,
              years: years,
              universities: universities,
              specialties: []
            };
            
            const { error: announcementError } = await supabaseAdmin
              .from('announcements')
              .insert({
                title: announcementTitle,
                content: announcementContent,
                author_id: authorUser.id,
                target_audience: targetAudience,
                priority: 'high',
                is_active: true,
                expires_at: null
              });
            
            if (announcementError) {
              console.error('Error creating announcement:', announcementError);
            } else {
              console.log(`✅ Announcement created successfully for ${newStatus} event`);
              announcementCreated = true;
            }
          }
        } catch (announcementErr) {
          console.error('Error in announcement creation process:', announcementErr);
          // Don't fail event update if announcement creation fails
        }
      }
    }
    
    // Return event with announcement creation status
    return NextResponse.json({
      ...data,
      announcementCreated,
      announcementStatus: announcementCreated ? announcementStatus : null
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check user role
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();
    
    if (!user || !['admin', 'educator', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }
    
    // Check for existing bookings before deletion
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('event_bookings')
      .select('id')
      .eq('event_id', params.id);
    
    if (bookingsError) {
      console.error('Error checking bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to check event bookings' }, { status: 500 });
    }
    
    if (bookings && bookings.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete event with existing bookings. Please cancel all bookings first.' 
      }, { status: 400 });
    }
    
    // Check for feedback forms before deletion (handle case where table doesn't exist)
    let feedbackForms: any[] = [];
    try {
      const { data, error: feedbackError } = await supabaseAdmin
        .from('feedback_forms')
        .select('id, form_name')
        .eq('event_id', params.id);
      
      if (feedbackError) {
        console.warn('Warning: Could not check feedback forms (table may not exist):', feedbackError);
        // Continue with deletion - don't fail if feedback_forms table doesn't exist
        feedbackForms = [];
      } else {
        feedbackForms = data || [];
      }
    } catch (error) {
      console.warn('Warning: Error accessing feedback_forms table:', error);
      // Continue with deletion - don't fail if feedback_forms table doesn't exist
      feedbackForms = [];
    }
    
    // Delete related feedback forms and responses
    if (feedbackForms && feedbackForms.length > 0) {
      console.log(`🗑️ Deleting ${feedbackForms.length} feedback forms for event ${params.id}`);
      
      // Delete feedback responses first (foreign key constraint)
      for (const form of feedbackForms) {
        const { error: responsesError } = await supabaseAdmin
          .from('feedback_responses')
          .delete()
          .eq('feedback_form_id', form.id);
        
        if (responsesError) {
          console.error(`Error deleting responses for form ${form.id}:`, responsesError);
        }
      }
      
      // Delete feedback forms
      const { error: formsDeleteError } = await supabaseAdmin
        .from('feedback_forms')
        .delete()
        .eq('event_id', params.id);
      
      if (formsDeleteError) {
        console.error('Error deleting feedback forms:', formsDeleteError);
        return NextResponse.json({ error: 'Failed to delete feedback forms' }, { status: 500 });
      }
    }
    
    // Delete certificates for this event
    console.log(`🗑️ Deleting certificates for event ${params.id}`);
    
    // First, get certificate records to find storage paths
    const { data: certificates, error: certFetchError } = await supabaseAdmin
      .from('certificates')
      .select('id, certificate_filename, certificate_url')
      .eq('event_id', params.id);
    
    if (certFetchError) {
      console.error('Error fetching certificates:', certFetchError);
    } else if (certificates && certificates.length > 0) {
      console.log(`🗑️ Found ${certificates.length} certificates to delete for event ${params.id}`);
      
      // Delete certificate files from storage
      for (const cert of certificates) {
        if (cert.certificate_filename) {
          try {
            console.log('🗑️ Deleting certificate file from storage:', cert.certificate_filename);
            
            const { error: storageDeleteError } = await supabaseAdmin.storage
              .from('certificates')
              .remove([cert.certificate_filename]);
            
            if (storageDeleteError) {
              console.error('Error deleting certificate file from storage:', storageDeleteError);
            } else {
              console.log('✅ Successfully deleted certificate file from storage:', cert.certificate_filename);
            }
          } catch (storageError) {
            console.error('Error deleting certificate file from storage:', cert.certificate_filename, storageError);
          }
        }
      }
    }
    
    // Delete certificate records from database
    const { error: certDeleteError } = await supabaseAdmin
      .from('certificates')
      .delete()
      .eq('event_id', params.id);
    
    if (certDeleteError) {
      console.error('Error deleting certificates from database:', certDeleteError);
      // Don't fail the entire deletion for certificate cleanup issues
    } else {
      console.log('✅ Successfully deleted certificate records from database');
    }
    
    // Delete QR codes for this event
    // First, get the QR code records to find storage paths
    const { data: qrCodes, error: qrFetchError } = await supabaseAdmin
      .from('event_qr_codes')
      .select('id, qr_code_image_url')
      .eq('event_id', params.id);
    
    if (qrFetchError) {
      console.error('Error fetching QR codes:', qrFetchError);
    } else if (qrCodes && qrCodes.length > 0) {
      console.log(`🗑️ Found ${qrCodes.length} QR codes to delete for event ${params.id}`);
      
      // Delete QR code files from storage
      for (const qrCode of qrCodes) {
        if (qrCode.qr_code_image_url) {
          try {
            // Extract the file path from the URL
            const url = new URL(qrCode.qr_code_image_url);
            const pathParts = url.pathname.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const folderName = pathParts[pathParts.length - 2];
            const storagePath = `${folderName}/${fileName}`;
            
            console.log('🗑️ Deleting QR code file from storage:', storagePath);
            
            const { error: storageDeleteError } = await supabaseAdmin.storage
              .from('qr-codes')
              .remove([storagePath]);
            
            if (storageDeleteError) {
              console.error('Error deleting QR code file from storage:', storageDeleteError);
            } else {
              console.log('✅ Successfully deleted QR code file from storage:', storagePath);
            }
          } catch (urlError) {
            console.error('Error parsing QR code URL:', qrCode.qr_code_image_url, urlError);
          }
        }
      }
    }
    
    // Now delete the QR code records from database
    const { error: qrDeleteError } = await supabaseAdmin
      .from('event_qr_codes')
      .delete()
      .eq('event_id', params.id);
    
    if (qrDeleteError) {
      console.error('Error deleting QR codes from database:', qrDeleteError);
      // Don't fail the entire deletion for QR code cleanup issues
    } else {
      console.log('✅ Successfully deleted QR code records from database');
    }
    
    // Get event title before deletion to find related announcements
    const { data: eventData } = await supabaseAdmin
      .from('events')
      .select('title, featured_image')
      .eq('id', params.id)
      .single();
    
    // Delete related announcements if event exists
    if (eventData && eventData.title) {
      try {
        console.log(`🗑️ Searching for announcements related to event: ${eventData.title}`);
        
        // Search for announcements with titles matching "Event Postponed: [Event Title]" or "Event Cancelled: [Event Title]"
        // Escape the event title to handle special characters in SQL LIKE patterns
        const escapedTitle = eventData.title.replace(/%/g, '\\%').replace(/_/g, '\\_');
        const postponedPattern = `Event Postponed: ${escapedTitle}`;
        const cancelledPattern = `Event Cancelled: ${escapedTitle}`;
        
        // Fetch all announcements and filter in code, or use two separate queries
        // Using a more flexible approach: search for announcements containing the event title
        const { data: allAnnouncements, error: announcementsFetchError } = await supabaseAdmin
          .from('announcements')
          .select('id, title');
        
        if (announcementsFetchError) {
          console.error('Error fetching announcements:', announcementsFetchError);
        } else {
          // Filter announcements that match our patterns
          const announcements = (allAnnouncements || []).filter((announcement: any) => {
            const title = announcement.title || '';
            return title.includes(postponedPattern) || title.includes(cancelledPattern);
          });
          
          if (announcements && announcements.length > 0) {
            console.log(`🗑️ Found ${announcements.length} announcement(s) to delete for event ${params.id}`);
            
            // Delete announcements
            const announcementIds = announcements.map(a => a.id);
            const { error: announcementsDeleteError } = await supabaseAdmin
              .from('announcements')
              .delete()
              .in('id', announcementIds);
            
            if (announcementsDeleteError) {
              console.error('Error deleting announcements:', announcementsDeleteError);
              // Don't fail the entire deletion for announcement cleanup issues
            } else {
              console.log(`✅ Successfully deleted ${announcements.length} announcement(s) related to event`);
            }
          }
        }
      } catch (announcementErr) {
        console.error('Error in announcement deletion process:', announcementErr);
        // Don't fail the entire deletion for announcement cleanup issues
      }
    }
    
    const shortId = params.id.replace(/-/g, '').slice(0, 8) || params.id;
    const folderCandidates = new Set<string>();
    const addCandidate = (value?: string | null) => {
      if (!value) return;
      const trimmed = value.trim();
      if (!trimmed) return;
      folderCandidates.add(trimmed);
    };

    addCandidate(params.id);
    addCandidate(shortId);

    const titleSlug = sanitizeSlug(eventData?.title);
    if (titleSlug) {
      addCandidate(titleSlug);
      if (shortId) {
        addCandidate(`${titleSlug}-${shortId}`);
      }
    }

    if (eventData?.featured_image) {
      const [firstSegment] = eventData.featured_image.split('/');
      if (firstSegment) {
        addCandidate(firstSegment);
      }
    }

    if (shortId) {
      try {
        const matchingFolders = await findFoldersMatchingShortId(shortId);
        matchingFolders.forEach((name) => addCandidate(name));
      } catch (folderSearchError) {
        console.error('Error searching storage folders for event:', folderSearchError);
      }
    }

    // Delete event (cascade will handle other relations)
    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`✅ Successfully deleted event ${params.id} and all related data`);

    try {
      if (folderCandidates.size > 0) {
        await cleanupEventStorageFolders(folderCandidates);
      }
    } catch (storageCleanupError) {
      console.error('Error cleaning up event storage folders:', storageCleanupError);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

type StorageListEntry = {
  name: string
  metadata: Record<string, any> | null
}

const isFolderEntry = (entry: StorageListEntry) => !entry.metadata

const listStorageEntries = async (
  path: string,
  offset: number
): Promise<{ entries: StorageListEntry[] | null }> => {
  const { data, error } = await supabaseAdmin.storage
    .from(EVENTS_BUCKET)
    .list(path, { limit: 1000, offset })

  if (error) {
    const message = error.message?.toLowerCase() || ''
    if (message.includes('not found') || message.includes('does not exist')) {
      return { entries: null }
    }
    throw error
  }

  return { entries: (data as StorageListEntry[]) || [] }
}

const findFoldersMatchingShortId = async (shortId: string): Promise<string[]> => {
  const matches: string[] = []
  let offset = 0

  while (true) {
    const { entries } = await listStorageEntries('', offset)
    if (entries === null || entries.length === 0) {
      break
    }

    for (const entry of entries) {
      if (!isFolderEntry(entry)) continue
      if (entry.name === shortId || entry.name.endsWith(`-${shortId}`)) {
        matches.push(entry.name)
      }
    }

    if (entries.length < 1000) {
      break
    }

    offset += entries.length
  }

  return matches
}

const collectFilesUnderPrefix = async (prefix: string): Promise<string[]> => {
  if (!prefix) return []

  const files: string[] = []
  const stack: string[] = [prefix]

  while (stack.length > 0) {
    const current = stack.pop()!
    let offset = 0

    while (true) {
      const { entries } = await listStorageEntries(current, offset)

      if (entries === null) {
        break
      }

      if (entries.length === 0) {
        break
      }

      for (const entry of entries) {
        const entryPath = current ? `${current}/${entry.name}` : entry.name
        if (isFolderEntry(entry)) {
          stack.push(entryPath)
        } else {
          files.push(entryPath)
        }
      }

      if (entries.length < 1000) {
        break
      }

      offset += entries.length
    }
  }

  return files
}

const removeStoragePaths = async (paths: string[]) => {
  const chunkSize = 100
  for (let i = 0; i < paths.length; i += chunkSize) {
    const chunk = paths.slice(i, i + chunkSize)
    const { error } = await supabaseAdmin.storage.from(EVENTS_BUCKET).remove(chunk)
    if (error) {
      throw error
    }
  }
}

const cleanupEventStorageFolders = async (folders: Set<string>) => {
  for (const folder of Array.from(folders)) {
    if (!folder || folder === 'drafts') continue
    try {
      const files = await collectFilesUnderPrefix(folder)
      if (files.length === 0) continue

      console.log(`🧹 Removing ${files.length} files from storage folder ${folder}`)
      await removeStoragePaths(files)
    } catch (error) {
      console.error(`Error cleaning up storage folder ${folder}:`, error)
    }
  }
}
