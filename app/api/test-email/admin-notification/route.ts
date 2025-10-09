import { NextRequest, NextResponse } from 'next/server';
import { sendAdminNewUserNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userName, signupTime, consentGiven, marketingConsent, analyticsConsent } = await request.json();
    
    await sendAdminNewUserNotification({ 
      userEmail, 
      userName, 
      signupTime, 
      consentGiven, 
      marketingConsent, 
      analyticsConsent 
    });
    
    return NextResponse.json({ success: true, message: 'Admin notification email sent' });
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
