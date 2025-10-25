import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase';

// Simple test endpoint to check categories without authentication
export async function GET() {
  try {
    // Get categories directly from the table
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      categories: data,
      count: data?.length || 0 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


