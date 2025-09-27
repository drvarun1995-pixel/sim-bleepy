import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate email domain for registration
    const allowedDomains = ['@ucl.ac.uk', '@student.aru.ac.uk', '@aru.ac.uk', '@nhs.net'];
    const isValidDomain = allowedDomains.some(domain => email.toLowerCase().endsWith(domain));
    
    if (!isValidDomain) {
      return NextResponse.json(
        { error: 'Only UCL, ARU, and NHS email addresses are allowed for registration' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Extract consent data from request body
    const { consent, marketing, analytics } = body;
    
    // Create user in database (unverified)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        name: name.trim(),
        password_hash: hashedPassword,
        auth_provider: 'email',
        email_verified: false,
        consent_given: consent || false,
        consent_timestamp: consent ? new Date().toISOString() : null,
        consent_version: '1.0',
        marketing_consent: marketing || false,
        analytics_consent: analytics || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, name, created_at')
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: newUser.id,
        token: verificationToken,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Token storage error:', tokenError);
      // Don't fail registration if token storage fails
    }

    // Send verification email
    try {
      const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify?token=${verificationToken}`;
      
      await sendVerificationEmail({
        email: newUser.email,
        name: newUser.name,
        verificationUrl
      });

      console.log('Verification email sent successfully to:', newUser.email);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail registration if email sending fails
    }

    // Return success response (don't include sensitive data)
    return NextResponse.json({
      message: 'Account created successfully! Please check your email to verify your account.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      },
      requiresVerification: true
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
