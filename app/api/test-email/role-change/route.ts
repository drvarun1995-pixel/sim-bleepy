import { NextRequest, NextResponse } from 'next/server';
import { sendRoleChangeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, name, oldRole, newRole } = await request.json();
    
    await sendRoleChangeEmail({ email, name, oldRole, newRole });
    
    return NextResponse.json({ success: true, message: 'Role change email sent' });
  } catch (error) {
    console.error('Error sending role change email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
