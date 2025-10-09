import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, name, verificationUrl } = await request.json();
    
    await sendVerificationEmail({ email, name, verificationUrl });
    
    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
