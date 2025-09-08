import { NextRequest, NextResponse } from 'next/server'
import { PromptExecutor } from '@/lib/promptExecutor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { promptName, input } = body

    if (!promptName || !input) {
      return NextResponse.json({ 
        success: false, 
        error: 'promptName and input are required' 
      }, { status: 400 })
    }

    console.log(`🔍 [DEBUG] Testing prompt: ${promptName}`)
    console.log(`🔍 [DEBUG] Input:`, JSON.stringify(input, null, 2))

    const result = await PromptExecutor.executeWithSchemaEnforcement(promptName, input)

    console.log(`✅ [DEBUG] Prompt executed successfully`)
    console.log(`📄 [DEBUG] Result:`, JSON.stringify(result, null, 2))

    return NextResponse.json({
      success: true,
      response: result
    })

  } catch (error) {
    console.error(`❌ [DEBUG] Prompt execution failed:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}