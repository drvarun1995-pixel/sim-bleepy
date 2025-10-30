import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

// POST - Create event with all relations
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check user role
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();
    
    if (!user || !['admin', 'educator', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }
    
    // Get request data
    const eventData = await request.json();
    
    // Extract relation IDs
    const speakerIds = eventData.speaker_ids || [];
    const categoryIds = eventData.category_ids || [];
    const locationIds = eventData.location_ids || [];
    const organizerIds = eventData.organizer_ids || [];
    
    // Remove relation arrays from event data
    const cleanEventData = { ...eventData };
    delete cleanEventData.speaker_ids;
    delete cleanEventData.category_ids;
    delete cleanEventData.location_ids;
    delete cleanEventData.organizer_ids;
    // Remove non-column hints used for follow-up feedback creation
    delete (cleanEventData as any).feedbackFormTemplate;
    delete (cleanEventData as any).feedbackCustomQuestions;
    
    // Insert event
    const { data: newEvent, error: eventError } = await supabaseAdmin
      .from('events')
      .insert([cleanEventData])
      .select()
      .single();
    
    if (eventError) {
      console.error('Error creating event:', eventError);
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }
    
    // Link categories to event
    if (categoryIds.length > 0 && newEvent) {
      const categoryLinks = categoryIds.map((categoryId: string) => ({
        event_id: newEvent.id,
        category_id: categoryId
      }));
      
      const { error: categoriesError } = await supabaseAdmin
        .from('event_categories')
        .insert(categoryLinks);
      
      if (categoriesError) {
        console.error('Error linking categories:', categoriesError);
        // Don't fail the whole operation, just log the error
      }
    }
    
    // Link locations to event
    if (locationIds.length > 0 && newEvent) {
      const locationLinks = locationIds.map((locationId: string) => ({
        event_id: newEvent.id,
        location_id: locationId
      }));
      
      const { error: locationsError } = await supabaseAdmin
        .from('event_locations')
        .insert(locationLinks);
      
      if (locationsError) {
        console.error('Error linking locations:', locationsError);
        // Don't fail the whole operation, just log the error
      }
    }
    
    // Link organizers to event
    if (organizerIds.length > 0 && newEvent) {
      const organizerLinks = organizerIds.map((organizerId: string) => ({
        event_id: newEvent.id,
        organizer_id: organizerId
      }));
      
      const { error: organizersError } = await supabaseAdmin
        .from('event_organizers')
        .insert(organizerLinks);
      
      if (organizersError) {
        console.error('Error linking organizers:', organizersError);
        // Don't fail the whole operation, just log the error
      }
    }
    
    // Link speakers to event
    if (speakerIds.length > 0 && newEvent) {
      const speakerLinks = speakerIds.map((speakerId: string) => ({
        event_id: newEvent.id,
        speaker_id: speakerId
      }));
      
      const { error: speakersError } = await supabaseAdmin
        .from('event_speakers')
        .insert(speakerLinks);
      
      if (speakersError) {
        console.error('Error linking speakers:', speakersError);
        // Don't fail the whole operation, just log the error
      }
    }
    
    // Auto-generate QR code if QR attendance is enabled
    if (newEvent && cleanEventData.qr_attendance_enabled) {
      try {
        console.log('🎯 Auto-generating QR code for event:', newEvent.id);
        console.log('🎯 Event QR attendance enabled:', cleanEventData.qr_attendance_enabled);
        
        const qrResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/qr-codes/auto-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: newEvent.id
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
          // Don't fail the event creation if QR generation fails
        }
    } else {
      console.log('🎯 Skipping QR code auto-generation - QR attendance not enabled or no event');
    }

    // Auto-create feedback form if feedback is enabled
    const isFeedbackEnabled = !!(eventData.feedbackEnabled || eventData.feedback_enabled || cleanEventData.feedback_enabled)
    if (isFeedbackEnabled && newEvent.id) {
      try {
        console.log('📝 Auto-creating feedback form for event:', newEvent.id);
        // Resolve template and questions
        let form_template: 'workshop' | 'seminar' | 'clinical_skills' | 'custom' = 'workshop';
        let questions: any[] | undefined = undefined;
        const selectedTemplate = eventData.feedbackFormTemplate && typeof eventData.feedbackFormTemplate === 'string' ? eventData.feedbackFormTemplate : 'auto-generate';

        if (selectedTemplate === 'auto-generate') {
          form_template = 'custom';
          questions = [
            { type: 'rating', question: 'How would you rate this event?', required: true, scale: 5 },
            { type: 'text', question: 'What did you learn from this event?', required: false },
            { type: 'yes_no', question: 'Would you recommend this event to others?', required: true },
          ];
        } else if (['workshop','seminar','clinical_skills','custom'].includes(selectedTemplate)) {
          form_template = selectedTemplate as any;
          questions = eventData.feedbackCustomQuestions || undefined;
        } else {
          // Treat as template ID: fetch from feedback_templates
          const { data: tpl } = await supabaseAdmin
            .from('feedback_templates')
            .select('id, category, questions, usage_count')
            .eq('id', selectedTemplate)
            .single();
          if (tpl) {
            form_template = (tpl.category as any) || 'custom';
            questions = (tpl.questions as any[]) || [];
            // Increment usage count directly (best-effort)
            try {
              const nextCount = (typeof (tpl as any).usage_count === 'number' ? (tpl as any).usage_count : 0) + 1;
              await supabaseAdmin
                .from('feedback_templates')
                .update({ usage_count: nextCount })
                .eq('id', selectedTemplate)
            } catch {}
          } else {
            form_template = 'custom';
            questions = [
              { type: 'rating', question: 'How would you rate this event?', required: true, scale: 5 },
              { type: 'text', question: 'What did you learn from this event?', required: false },
              { type: 'yes_no', question: 'Would you recommend this event to others?', required: true },
            ];
          }
        }

        // Deactivate any existing active forms, then insert the new one
        try {
          await supabaseAdmin
            .from('feedback_forms')
            .update({ active: false })
            .eq('event_id', newEvent.id)
            .eq('active', true)
        } catch (e) {
          console.warn('Could not deactivate existing feedback forms (likely none):', e)
        }

        const { data: insertedForm, error: insertFormError } = await supabaseAdmin
          .from('feedback_forms')
          .insert({
            event_id: newEvent.id,
            form_name: `Feedback for ${eventData.title}`,
            form_template,
            questions: questions || null,
            anonymous_enabled: false,
            active: true,
            created_by: user?.id || null,
          })
          .select('id')
          .single()

        if (insertFormError) {
          console.error('❌ Failed to auto-create feedback form (direct insert):', insertFormError)
        } else {
          console.log('✅ Feedback form auto-created successfully:', insertedForm?.id)
        }

        // If a concrete template ID was used, increment usage count safely
        if (selectedTemplate && !['auto-generate','workshop','seminar','clinical_skills','custom'].includes(selectedTemplate)) {
          await supabaseAdmin
            .from('feedback_templates')
            .update({ usage_count: (supabaseAdmin as any).rpc ? undefined : undefined })
        }
      } catch (feedbackError) {
        console.error('❌ Error auto-creating feedback form:', feedbackError);
        // Don't fail the event creation if feedback form creation fails
      }
    } else {
      console.log('🎯 Skipping feedback form auto-creation - feedback not enabled or no event');
    }
    
    return NextResponse.json(newEvent);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}






























