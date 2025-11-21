/**
 * Certificate notification service
 */

import { supabaseAdmin } from '@/utils/supabase';
import { sendToUser } from './notificationService';
import { NotificationPayload } from './types';

/**
 * Send certificate available notification
 */
export async function sendCertificateAvailableNotification(
  certificateId: string
): Promise<{ sent: number; failed: number }> {
  try {
    // Fetch certificate with event details
    const { data: certificate, error: certError } = await supabaseAdmin
      .from('certificates')
      .select(`
        id,
        user_id,
        event_id,
        certificate_url,
        events (
          id,
          title
        )
      `)
      .eq('id', certificateId)
      .single();

    if (certError || !certificate) {
      return { sent: 0, failed: 0 };
    }

    const event = certificate.events as any;
    const downloadUrl = certificate.certificate_url;

    const payload: NotificationPayload = {
      title: 'Certificate Available',
      body: `Your certificate for "${event.title}" is now available for download.`,
      url: downloadUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://sim.bleepy.co.uk'}/certificates`,
      data: {
        type: 'certificate',
        id: certificateId,
        eventId: event.id,
      },
    };

    return await sendToUser(certificate.user_id, payload, 'certificate_available', {
      certificateId,
      eventId: event.id,
    });
  } catch (error) {
    console.error('Error sending certificate notification:', error);
    return { sent: 0, failed: 0 };
  }
}

