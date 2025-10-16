import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('Simple API called')
    
    // Check authentication
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user?.email)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, name, role } = await request.json()
    console.log('Received data:', { email, name, role })

    return NextResponse.json({ 
      success: true,
      message: 'Simple API working',
      data: { email, name, role }
    })
  } catch (error) {
    console.error('Simple API error:', error)
    return NextResponse.json({ 
      error: 'Simple API failed',
      details: error.message 
    }, { status: 500 })
  }
}
