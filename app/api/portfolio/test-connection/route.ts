import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    
    // Test database connection
    const { data: dbTest, error: dbError } = await supabaseAdmin
      .from('portfolio_files')
      .select('count')
      .limit(1)
    
    console.log('Database test result:', { data: dbTest, error: dbError })
    
    // Test storage connection
    const { data: storageTest, error: storageError } = await supabaseAdmin.storage
      .from('imt-portfolio')
      .list('', {
        limit: 1
      })
    
    console.log('Storage test result:', { data: storageTest, error: storageError })
    
    // Test alternative bucket name
    const { data: altStorageTest, error: altStorageError } = await supabaseAdmin.storage
      .from('IMT Portfolio')
      .list('', {
        limit: 1
      })
    
    console.log('Alternative storage test result:', { data: altStorageTest, error: altStorageError })
    
    return NextResponse.json({
      success: true,
      tests: {
        database: {
          success: !dbError,
          error: dbError?.message || null
        },
        storage_imt_portfolio: {
          success: !storageError,
          error: storageError?.message || null,
          bucket_exists: !storageError || storageError.message !== 'Bucket not found'
        },
        storage_IMT_Portfolio: {
          success: !altStorageError,
          error: altStorageError?.message || null,
          bucket_exists: !altStorageError || altStorageError.message !== 'Bucket not found'
        }
      }
    })

  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
