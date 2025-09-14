import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // MailerLite API integration
    const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
    const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;

    if (!MAILERLITE_API_KEY || !MAILERLITE_GROUP_ID) {
      console.error('MailerLite configuration missing');
      return NextResponse.json({ error: 'Newsletter service not configured' }, { status: 500 });
    }

    // Add subscriber to MailerLite
    const response = await fetch(`https://connect.mailerlite.com/api/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        groups: [MAILERLITE_GROUP_ID],
        status: 'active'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('MailerLite API error:', errorData);
      
      // If subscriber already exists, that's okay
      if (response.status === 409) {
        return NextResponse.json({ 
          message: 'You are already subscribed to our newsletter!' 
        });
      }
      
      return NextResponse.json({ 
        error: 'Failed to subscribe to newsletter' 
      }, { status: 500 });
    }

    const data = await response.json();
    console.log('Successfully subscribed:', data);

    // Track newsletter signup in Supabase (optional - won't fail if Supabase is not configured)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('newsletter_signups')
          .insert({
            email: email,
            source: source || 'unknown',
            user_agent: request.headers.get('user-agent'),
            ip_address: request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
          });
        
        console.log('Newsletter signup tracked in Supabase');
      }
    } catch (supabaseError) {
      // Don't fail the newsletter signup if Supabase tracking fails
      console.warn('Failed to track newsletter signup in Supabase:', supabaseError);
    }

    return NextResponse.json({ 
      message: 'Successfully subscribed to our newsletter!' 
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ 
      error: 'Failed to subscribe to newsletter' 
    }, { status: 500 });
  }
}
