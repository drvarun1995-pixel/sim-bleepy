import { NextRequest, NextResponse } from 'next/server';
import { sendAccountApprovalEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    
    await sendAccountApprovalEmail({ email, name });
    
    return NextResponse.json({ success: true, message: 'Account approval email sent' });
  } catch (error) {
    console.error('Error sending approval email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
