import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Encryption/Decryption functions for storing password in reversible format
function encryptPassword(password: string): string {
  const algorithm = 'aes-256-cbc'
  const secretKey = process.env.DOWNLOAD_PASSWORD_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'default-encryption-key-change-in-production'
  const key = crypto.scryptSync(secretKey, 'salt', 32)
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(password, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Return IV + encrypted data (IV needed for decryption)
  return iv.toString('hex') + ':' + encrypted
}

function decryptPassword(encryptedData: string): string {
  const algorithm = 'aes-256-cbc'
  const secretKey = process.env.DOWNLOAD_PASSWORD_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'default-encryption-key-change-in-production'
  const key = crypto.scryptSync(secretKey, 'salt', 32)
  
  const parts = encryptedData.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// GET: Retrieve password status (for admin/MedEd/CTF only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has permission (admin, meded_team, or ctf)
    if (!['admin', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get the setting (including encrypted password for viewing)
    const { data: setting, error: settingError } = await supabaseAdmin
      .from('platform_settings')
      .select('updated_at, updated_by, encrypted_value')
      .eq('setting_key', 'download_password_hash')
      .single()

    if (settingError || !setting) {
      return NextResponse.json({
        configured: false,
        lastUpdated: null,
        password: null,
      })
    }

    // Get who updated it
    let updatedByName = null
    if (setting.updated_by) {
      const { data: updater } = await supabaseAdmin
        .from('users')
        .select('name, email')
        .eq('id', setting.updated_by)
        .single()
      
      if (updater) {
        updatedByName = updater.name || updater.email
      }
    }

    // Decrypt the password for viewing
    let decryptedPassword = null
    if (setting.encrypted_value) {
      try {
        decryptedPassword = decryptPassword(setting.encrypted_value)
      } catch (error) {
        console.error('Error decrypting password:', error)
        // If decryption fails, password might be from old format - return null
        decryptedPassword = null
      }
    }

    return NextResponse.json({
      configured: true,
      lastUpdated: setting.updated_at,
      updatedBy: updatedByName,
      password: decryptedPassword, // Return decrypted password for admin viewing
    })
  } catch (error) {
    console.error('Error fetching download password status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Set/update the download password (for admin/MedEd/CTF only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { password } = await request.json()

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Get user role and ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has permission (admin, meded_team, or ctf)
    if (!['admin', 'meded_team', 'ctf'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    // Hash the password (for verification)
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    // Encrypt the password (for admin viewing)
    const encryptedPassword = encryptPassword(password)

    // Check if setting exists
    const { data: existing } = await supabaseAdmin
      .from('platform_settings')
      .select('id')
      .eq('setting_key', 'download_password_hash')
      .single()

    if (existing) {
      // Update existing setting
      const { error: updateError } = await supabaseAdmin
        .from('platform_settings')
        .update({
          setting_value: hashedPassword, // Bcrypt hash for verification
          encrypted_value: encryptedPassword, // Encrypted password for viewing
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', 'download_password_hash')

      if (updateError) {
        console.error('Error updating download password:', updateError)
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        )
      }
    } else {
      // Insert new setting
      const { error: insertError } = await supabaseAdmin
        .from('platform_settings')
        .insert({
          setting_key: 'download_password_hash',
          setting_value: hashedPassword, // Bcrypt hash for verification
          encrypted_value: encryptedPassword, // Encrypted password for viewing
          description: 'Hashed password for protecting document downloads. Only medical students should have access.',
          updated_by: user.id,
        })

      if (insertError) {
        console.error('Error creating download password:', insertError)
        return NextResponse.json(
          { error: 'Failed to set password' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Download password updated successfully',
    })
  } catch (error) {
    console.error('Error setting download password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

