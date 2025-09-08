import { NextResponse } from 'next/server'
import { PromptExecutor } from '@/lib/promptExecutor'

export async function POST() {
  try {
    console.log('🗑️ [DEBUG] Clearing prompt cache...')
    PromptExecutor.clearCache()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Prompt cache cleared successfully' 
    })
  } catch (error) {
    console.error('❌ [DEBUG] Error clearing cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}
