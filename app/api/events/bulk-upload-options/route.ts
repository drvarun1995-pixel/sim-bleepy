import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Type parameter required' }, { status: 400 });
    }

    let data = [];

    switch (type) {
      case 'locations':
        const locationsRes = await supabaseAdmin
          .from('locations')
          .select('id, name')
          .order('name');
        data = locationsRes.data || [];
        break;

      case 'speakers':
        const speakersRes = await supabaseAdmin
          .from('speakers')
          .select('id, name, role')
          .order('name');
        data = speakersRes.data || [];
        break;

      case 'categories':
        const categoriesRes = await supabaseAdmin
          .from('categories')
          .select('id, name, slug, color')
          .order('name');
        data = categoriesRes.data || [];
        break;

      case 'formats':
        const formatsRes = await supabaseAdmin
          .from('formats')
          .select('id, name, slug, color')
          .order('name');
        data = formatsRes.data || [];
        break;

      case 'organizers':
        const organizersRes = await supabaseAdmin
          .from('organizers')
          .select('id, name')
          .order('name');
        data = organizersRes.data || [];
        break;

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json({ data });

  } catch (error: any) {
    console.error('Bulk upload options error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch options' },
      { status: 500 }
    );
  }
}

