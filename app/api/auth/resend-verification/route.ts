import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find the verification token and get user info
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select(`
        user_id,
        expires_at,
        users!inner(email, name, email_verified)
      `)
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if user is already verified
    if (tokenData.users?.[0]?.email_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const newVerificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete old token and create new one
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('token', token);

    const { error: insertError } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: tokenData.user_id,
        token: newVerificationToken,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Token storage error:', insertError);
      return NextResponse.json(
        { error: 'Failed to generate new verification token' },
        { status: 500 }
      );
    }

    // Send new verification email
    try {
      const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify?token=${newVerificationToken}`;
      
      await sendVerificationEmail({
        email: tokenData.users?.[0]?.email || '',
        name: tokenData.users?.[0]?.name || '',
        verificationUrl
      });

      console.log('New verification email sent to:', tokenData.users?.[0]?.email);

      return NextResponse.json({
        message: 'New verification email sent successfully!'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
