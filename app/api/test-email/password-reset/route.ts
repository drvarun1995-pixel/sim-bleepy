import { requireAdminApi } from '@/lib/require-admin-api'
import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const adminDenied = await requireAdminApi()
  if (adminDenied) return adminDenied

  try {
    const { email, name, resetUrl } = await request.json();
    
    await sendPasswordResetEmail({ email, name, resetUrl });
    
    return NextResponse.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
