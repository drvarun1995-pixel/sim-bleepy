import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendVerificationEmail } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, email_verified')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is already verified
    if (user.email_verified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
    }

    // Delete any existing verification tokens for this user
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('user_id', user.id);

    // Generate new verification token
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    // Store verification token (48 hours expiration)
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('Token creation error:', tokenError);
      return NextResponse.json({ error: 'Failed to create verification token' }, { status: 500 });
    }

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;
    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      verificationUrl
    });

    return NextResponse.json({ 
      message: 'Verification email sent successfully',
      email: user.email 
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}