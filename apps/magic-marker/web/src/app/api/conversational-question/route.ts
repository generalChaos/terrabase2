import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai'
import { Question } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      imageAnalysis, 
      previousAnswers, 
      conversationContext, 
      imageId 
    } = body

    if (!imageAnalysis) {
      return NextResponse.json(
        { error: 'imageAnalysis is required' },
        { status: 400 }
      )
    }

    console.log('🤖 [API] Generating conversational question...', {
      imageId: imageId?.substring(0, 8) + '...',
      previousAnswersCount: previousAnswers?.length || 0,
      hasConversationContext: !!conversationContext
    })

    const result = await OpenAIService.generateConversationalQuestion(
      imageAnalysis,
      previousAnswers || [],
      conversationContext || { questions: [], previousAnswers: [] },
      imageId
    )

    console.log('✅ [API] Conversational question generated:', {
      done: result.done,
      hasQuestion: !!result.question,
      questionsCount: result.questions.length,
      hasSummary: !!result.summary
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ [API] Conversational question generation failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate conversational question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
