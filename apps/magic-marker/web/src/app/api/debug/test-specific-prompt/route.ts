import { NextRequest, NextResponse } from 'next/server';
import { PromptExecutor } from '@/lib/promptExecutor';

export async function POST(request: NextRequest) {
  try {
    const { analysis, qa } = await request.json();

    // Create the Q&A string exactly as it would be in the real API
    const questionsAndAnswers = qa.map((q: { text: string; answer?: string }, index: number) => {
      const answer = q.answer || 'Not specified';
      return `${q.text}: ${answer}`;
    }).join('\n');


    const result = await PromptExecutor.executeSimple('image_generation', {
      analysis: analysis,
      q_and_a: questionsAndAnswers,
      prompt: ''
    });


    return NextResponse.json({
      success: true,
      generatedPrompt: result,
      analysis,
      qa
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
