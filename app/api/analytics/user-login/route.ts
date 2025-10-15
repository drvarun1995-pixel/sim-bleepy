import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User login tracking API called for:', session.user.email);

    // Get current user data first
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('login_count')
      .eq('email', session.user.email)
      .single();

    if (fetchError) {
      console.error('Error fetching user data:', fetchError);
      return NextResponse.json({ 
        success: true, 
        message: 'Login tracking attempted',
        warning: 'Could not fetch user record'
      });
    }

    // Update both last_login and increment login_count
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        login_count: (currentUser?.login_count || 0) + 1
      })
      .eq('email', session.user.email)
      .select()
      .single();

    if (error) {
      console.error('Error updating user login:', error);
      // Don't fail completely - just log the error and return success
      // This prevents the error from showing in the console
      return NextResponse.json({ 
        success: true, 
        message: 'Login tracking attempted',
        warning: 'Could not update user record'
      });
    }

    console.log('Successfully updated user login:', data);
    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error('Error in user login tracking API:', error);
    // Don't fail completely - just log the error and return success
    return NextResponse.json({ 
      success: true, 
      message: 'Login tracking attempted',
      warning: 'Unexpected error occurred'
    });
  }
}
