import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/utils/supabase';

// GET - List all images in the placements bucket
export async function GET(request: NextRequest) {
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

    // Get optional folder path from query
    const { searchParams } = new URL(request.url);
    const folderPath = searchParams.get('folder') || '';
    const recursive = searchParams.get('recursive') === 'true';

    // If recursive is requested and no folder specified, list all files recursively
    if (recursive && !folderPath) {
      const allFiles: any[] = [];
      
      // Recursive function to list all files
      const listRecursive = async (path: string = '') => {
        const { data: items, error: listError } = await supabaseAdmin.storage
          .from('placements')
          .list(path, {
            limit: 1000,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (listError) {
          console.error(`Error listing ${path}:`, listError);
          return;
        }

        if (!items || items.length === 0) return;

        for (const item of items) {
          const fullPath = path ? `${path}/${item.name}` : item.name;
          
          if (item.id) {
            // It's a file
            allFiles.push({
              name: item.name,
              path: fullPath,
              size: item.metadata?.size || 0,
              created_at: item.created_at,
              updated_at: item.updated_at,
              mimetype: item.metadata?.mimetype || 'unknown'
            });
          } else if (item.name) {
            // It's a folder - recursively list its contents
            await listRecursive(fullPath);
          }
        }
      }

      await listRecursive();
      
      return NextResponse.json({ 
        success: true,
        folder: '(all files recursively)',
        files: allFiles,
        count: allFiles.length,
        folderCount: 0
      });
    }

    // List files/folders at the specified path
    const { data: items, error } = await supabaseAdmin.storage
      .from('placements')
      .list(folderPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Error listing files:', error);
      return NextResponse.json({ 
        error: 'Failed to list files',
        details: error.message 
      }, { status: 500 });
    }

    // Separate files and folders
    const files = (items || []).filter(item => item.id); // Files have an id
    const folders = (items || []).filter(item => !item.id && item.name); // Folders don't have an id

    return NextResponse.json({ 
      success: true,
      folder: folderPath || '(root)',
      files: files.map(f => ({
        name: f.name,
        path: folderPath ? `${folderPath}/${f.name}` : f.name,
        size: f.metadata?.size || 0,
        created_at: f.created_at,
        updated_at: f.updated_at,
        mimetype: f.metadata?.mimetype || 'unknown'
      })),
      folders: folders.map(f => ({
        name: f.name,
        path: folderPath ? `${folderPath}/${f.name}` : f.name
      })),
      count: files.length,
      folderCount: folders.length
    });

  } catch (error) {
    console.error('Error in list images API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
