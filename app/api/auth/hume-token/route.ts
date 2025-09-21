import { NextRequest, NextResponse } from 'next/server'
import { getHumeAccessToken } from '@/utils/getHumeAccessToken'

export async function POST(request: NextRequest) {
  try {
    console.log('Fetching Hume access token via API...')
    
    const token = await getHumeAccessToken()
    
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to get access token' },
        { status: 500 }
      )
    }

    console.log('Successfully fetched Hume access token')
    
    return NextResponse.json({ 
      token,
      expiresIn: 3600 // 1 hour in seconds
    })
  } catch (error) {
    console.error('Error fetching Hume access token:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
