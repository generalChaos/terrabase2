import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const environment = process.env.NODE_ENV || 'development'
    
    // Check database connection
    const databaseStatus = { connected: false, error: undefined as string | undefined }
    try {
      const { data, error } = await supabaseAdmin.from('prompts').select('count').limit(1)
      if (error) {
        databaseStatus.error = error.message
      } else {
        databaseStatus.connected = true
      }
    } catch (error) {
      databaseStatus.error = error instanceof Error ? error.message : 'Unknown database error'
    }

    // Check OpenAI configuration
    const openaiStatus = { configured: false, error: undefined as string | undefined }
    try {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        openaiStatus.error = 'OPENAI_API_KEY not set'
      } else if (apiKey.length < 10) {
        openaiStatus.error = 'OPENAI_API_KEY appears to be invalid'
      } else {
        openaiStatus.configured = true
      }
    } catch (error) {
      openaiStatus.error = error instanceof Error ? error.message : 'Unknown OpenAI error'
    }

    // Check Supabase configuration
    const supabaseStatus = { configured: false, error: undefined as string | undefined }
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        supabaseStatus.error = 'Supabase environment variables not set'
      } else if (!supabaseUrl.includes('supabase') || supabaseAnonKey.length < 20) {
        supabaseStatus.error = 'Supabase configuration appears to be invalid'
      } else {
        supabaseStatus.configured = true
      }
    } catch (error) {
      supabaseStatus.error = error instanceof Error ? error.message : 'Unknown Supabase error'
    }

    // Check storage availability
    const storageStatus = { uploads_available: false, error: undefined as string | undefined }
    try {
      // Check if uploads directory exists and is writable
      const uploadsDir = path.join(process.cwd(), 'uploads')
      
      if (!fs.existsSync(uploadsDir)) {
        storageStatus.error = 'Uploads directory does not exist'
      } else {
        // Try to write a test file
        const testFile = path.join(uploadsDir, 'test-write.tmp')
        fs.writeFileSync(testFile, 'test')
        fs.unlinkSync(testFile)
        storageStatus.uploads_available = true
      }
    } catch (error) {
      storageStatus.error = error instanceof Error ? error.message : 'Storage not accessible'
    }

    // Get prompts information
    const promptsInfo = { database_enabled: false, total_prompts: 0, active_prompts: 0 }
    try {
      const useDatabasePrompts = process.env.USE_DATABASE_PROMPTS === 'true'
      promptsInfo.database_enabled = useDatabasePrompts

      if (databaseStatus.connected) {
        const { data: allPrompts } = await supabaseAdmin.from('prompts').select('id, active')
        const { data: activePrompts } = await supabaseAdmin.from('prompts').select('id').eq('active', true)
        
        promptsInfo.total_prompts = allPrompts?.length || 0
        promptsInfo.active_prompts = activePrompts?.length || 0
      }
    } catch (error) {
      console.error('Error getting prompts info:', error)
    }

    const systemStatus = {
      environment,
      database: databaseStatus,
      openai: openaiStatus,
      supabase: supabaseStatus,
      storage: storageStatus,
      prompts: promptsInfo
    }

    return NextResponse.json(systemStatus)
  } catch (error) {
    console.error('Error getting system status:', error)
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    )
  }
}
