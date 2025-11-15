import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

const sanitizeSlug = (value: string | null): string | null => {
  if (!value) return null
  const slug = value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return slug || null;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (!user || !['admin', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const eventId = body?.eventId as string | undefined;
    const eventSlug = sanitizeSlug(body?.eventSlug ?? null);
    const paths = Array.isArray(body?.paths) ? body.paths : [];

    if (!eventId || paths.length === 0) {
      return NextResponse.json({ error: 'eventId and paths are required' }, { status: 400 });
    }

    const shortId = eventId.replace(/-/g, '').slice(0, 8) || eventId;
    const baseFolder = eventSlug ? `${eventSlug}-${shortId}` : shortId;

    const pathMap: Record<string, string> = {};

    for (const rawPath of paths) {
      if (typeof rawPath !== 'string') continue;
      const trimmedPath = rawPath.trim();
      if (!trimmedPath.startsWith('drafts/')) continue;

      const relativePath = trimmedPath.replace(/^drafts\//, '');
      const destinationPath = `${baseFolder}/${relativePath}`;

      const { error: moveError } = await supabaseAdmin.storage
        .from('events')
        .move(trimmedPath, destinationPath);

      if (moveError) {
        console.error('Error promoting image from draft:', moveError);
        return NextResponse.json(
          { error: 'Failed to promote draft images' },
          { status: 500 }
        );
      }

      pathMap[trimmedPath] = destinationPath;
    }

    return NextResponse.json({ pathMap });
  } catch (error) {
    console.error('Error promoting draft images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

