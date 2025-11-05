import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

// GET - Fetch a single specialty page
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: page, error } = await supabaseAdmin
      .from('specialty_pages')
      .select('*')
      .eq('id', params.id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }
      console.error('Error fetching specialty page:', error);
      return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error in specialty page API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a specialty page
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (!user || !['admin', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, display_order, is_active } = body;

    const updates: any = {
      updated_at: new Date().toISOString()
    };

    // Get current page to check specialty_id and current slug
    const { data: currentPage } = await supabaseAdmin
      .from('specialty_pages')
      .select('specialty_id, slug, title')
      .eq('id', params.id)
      .single();

    if (!currentPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // If title changed, regenerate slug from new title
    if (title !== undefined && title !== currentPage.title) {
      // Generate slug from title
      let baseSlug = title.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

      if (!baseSlug) {
        baseSlug = 'page';
      }

      // Ensure uniqueness by checking existing slugs and appending numbers if needed
      let finalSlug = baseSlug;
      let counter = 1;
      let isUnique = false;

      while (!isUnique) {
        const { data: existing } = await supabaseAdmin
          .from('specialty_pages')
          .select('id')
          .eq('specialty_id', currentPage.specialty_id)
          .eq('slug', finalSlug)
          .neq('id', params.id) // Exclude current page
          .single();

        if (!existing) {
          isUnique = true;
        } else {
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      updates.title = title;
      updates.slug = finalSlug;
    } else if (title !== undefined) {
      updates.title = title;
    }

    if (content !== undefined) updates.content = content;
    if (display_order !== undefined) updates.display_order = display_order;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data: page, error } = await supabaseAdmin
      .from('specialty_pages')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating specialty page:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error in update specialty page API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a specialty page
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (!user || !['admin', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    // Get page details to determine folder path before deleting
    const { data: page } = await supabaseAdmin
      .from('specialty_pages')
      .select('slug, specialty_id, specialties!inner(slug)')
      .eq('id', params.id)
      .single();

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const specialtySlug = (page as any).specialties.slug;
    const pageSlug = page.slug;

    // Delete the page folder from storage: {specialtySlug}/{pageSlug}/
    const folderPath = `${specialtySlug}/${pageSlug}`;
    
    try {
      // List all files in the folder
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from('placements')
        .list(folderPath, {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (!listError && files && files.length > 0) {
        // Delete all files in the folder recursively
        const filePaths = files
          .filter(file => file.name) // Filter out folder entries
          .map(file => `${folderPath}/${file.name}`);

        // Also check for nested folders (images, documents)
        const nestedFolders = ['images', 'documents'];
        for (const nestedFolder of nestedFolders) {
          const nestedPath = `${folderPath}/${nestedFolder}`;
          const { data: nestedFiles } = await supabaseAdmin.storage
            .from('placements')
            .list(nestedPath, {
              limit: 1000,
              offset: 0
            });

          if (nestedFiles && nestedFiles.length > 0) {
            const nestedFilePaths = nestedFiles
              .filter(file => file.name)
              .map(file => `${nestedPath}/${file.name}`);
            filePaths.push(...nestedFilePaths);
          }
        }

        if (filePaths.length > 0) {
          const { error: deleteError } = await supabaseAdmin.storage
            .from('placements')
            .remove(filePaths);

          if (deleteError) {
            console.error('Error deleting files from storage:', deleteError);
            // Continue with page deletion even if file deletion fails
          }
        }
      }
    } catch (storageError) {
      console.error('Error accessing storage:', storageError);
      // Continue with page deletion even if storage access fails
    }

    // Delete the page from database
    const { error } = await supabaseAdmin
      .from('specialty_pages')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting specialty page:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete specialty page API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

