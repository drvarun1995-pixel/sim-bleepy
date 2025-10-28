import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test upload API called')
    
    const { canvasDataUrl } = await request.json()
    
    console.log('🧪 Canvas data URL length:', canvasDataUrl?.length || 0)
    console.log('🧪 Canvas data URL starts with data:image:', canvasDataUrl?.startsWith('data:image/') || false)
    
    if (!canvasDataUrl || !canvasDataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid canvas data URL' }, { status: 400 })
    }
    
    const base64Data = canvasDataUrl.replace(/^data:image\/png;base64,/, '')
    console.log('🧪 Base64 data length:', base64Data.length)
    
    const buffer = Buffer.from(base64Data, 'base64')
    console.log('🧪 Buffer size:', buffer.length)
    
    const blob = new Blob([buffer], { type: 'image/png' })
    console.log('🧪 Blob created successfully, size:', blob.size)
    
    const testPath = 'test/test-certificate.png'
    console.log('🧪 Uploading to:', testPath)
    
    const { data, error } = await supabaseAdmin.storage
      .from('certificates')
      .upload(testPath, blob, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('❌ Upload error:', error)
      return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 })
    }
    
    console.log('✅ Upload successful:', data)
    
    return NextResponse.json({ success: true, data })
    
  } catch (error) {
    console.error('❌ Test upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
