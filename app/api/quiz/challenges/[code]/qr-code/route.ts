import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

// GET - Generate or retrieve QR code for a challenge
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get challenge
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('quiz_challenges')
      .select('id, code, qr_code_url')
      .eq('code', params.code)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    // If QR code already exists, return it
    if (challenge.qr_code_url) {
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('challenge-qr-codes')
        .getPublicUrl(challenge.qr_code_url)
      
      return NextResponse.json({ qrCodeUrl: publicUrl })
    }

    // Generate QR code
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    const qrCodeData = `${baseUrl}/games/challenge/${params.code}`

    // Generate QR code image buffer
    const qrCodeOptions = {
      type: 'png' as const,
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 512
    }

    const qrCodeImageBuffer = await QRCode.toBuffer(qrCodeData, qrCodeOptions)

    // Upload to Supabase storage
    const fileName = `challenge-${params.code}-${Date.now()}.png`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('challenge-qr-codes')
      .upload(fileName, qrCodeImageBuffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading QR code:', uploadError)
      return NextResponse.json({ error: 'Failed to upload QR code' }, { status: 500 })
    }

    // Update challenge with QR code URL
    const { error: updateError } = await supabaseAdmin
      .from('quiz_challenges')
      .update({ qr_code_url: fileName })
      .eq('id', challenge.id)

    if (updateError) {
      console.error('Error updating challenge with QR code URL:', updateError)
      // Continue even if update fails - we can still return the URL
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('challenge-qr-codes')
      .getPublicUrl(fileName)

    return NextResponse.json({ qrCodeUrl: publicUrl })
  } catch (error) {
    console.error('Error in GET /api/quiz/challenges/[code]/qr-code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

