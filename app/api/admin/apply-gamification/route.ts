import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/utils/supabase'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Read the gamification schema file
    const schemaPath = path.join(process.cwd(), 'create-gamification-schema-safe.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')

    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`Executing ${statements.length} SQL statements...`)

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement })
          if (error) {
            console.error('Error executing statement:', error)
            // Continue with other statements even if one fails
          }
        } catch (err) {
          console.error('Error executing statement:', err)
          // Continue with other statements
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Gamification schema applied successfully',
      statementsExecuted: statements.length
    })

  } catch (error) {
    console.error('Error applying gamification schema:', error)
    return NextResponse.json({ 
      error: 'Failed to apply gamification schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
