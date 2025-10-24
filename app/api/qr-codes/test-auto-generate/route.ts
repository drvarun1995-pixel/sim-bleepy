import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing auto-generation for event')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json({ 
        error: 'Missing required field: eventId' 
      }, { status: 400 })
    }

    console.log('🧪 Testing auto-generation for event:', eventId)

    // Call the auto-generate API
    const qrResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/qr-codes/auto-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: eventId
      })
    });

    console.log('🧪 QR response status:', qrResponse.status);
    
    if (qrResponse.ok) {
      const qrData = await qrResponse.json();
      console.log('✅ QR code auto-generated successfully:', qrData.qrCode?.id);
      return NextResponse.json({ 
        success: true, 
        qrCode: qrData.qrCode,
        message: 'QR code generated successfully'
      });
    } else {
      const errorText = await qrResponse.text();
      console.error('❌ Failed to auto-generate QR code:', qrResponse.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to generate QR code',
        details: errorText,
        status: qrResponse.status
      }, { status: qrResponse.status });
    }

  } catch (error) {
    console.error('❌ Error in test auto-generation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

