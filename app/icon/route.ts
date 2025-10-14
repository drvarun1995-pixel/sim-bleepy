import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const faviconPath = join(process.cwd(), 'public', 'favicon.ico');
    const faviconBuffer = await readFile(faviconPath);
    
    return new NextResponse(faviconBuffer, {
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving favicon:', error);
    return new NextResponse('Favicon not found', { status: 404 });
  }
}


