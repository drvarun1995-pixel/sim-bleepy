import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('Email verification request received');
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    console.log('Token received:', token ? `${token.substring(0, 10)}...` : 'none');

    if (!token) {
      console.log('No token provided');
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find and validate the verification token
    console.log('Looking up token in database...');
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('user_id, expires_at, created_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      console.log('Token lookup failed:', tokenError);
      return NextResponse.json(
        { error: 'Invalid verification token. Please request a new verification email.' },
        { status: 400 }
      );
    }

    console.log('Token found:', {
      user_id: tokenData.user_id,
      expires_at: tokenData.expires_at,
      created_at: tokenData.created_at
    });

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    console.log('Token expiration check:', {
      now: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_expired: now > expiresAt
    });

    if (now > expiresAt) {
      console.log('Token has expired');
      return NextResponse.json(
        { error: 'This verification link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark user as verified
    console.log('Updating user email_verified status...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenData.user_id);

    if (updateError) {
      console.error('User update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    console.log('User email verified successfully');

    // Delete the used token
    console.log('Deleting used token...');
    await supabase
      .from('email_verification_tokens')
      .delete()
      .eq('token', token);

    console.log('Token deleted, verification complete');
    return NextResponse.json({
      message: 'Email verified successfully!'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
