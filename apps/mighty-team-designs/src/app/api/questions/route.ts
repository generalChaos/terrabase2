import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { openai } from '@/lib/openai';
import { logDebug } from '@/lib/debug';

// Validation schemas
const GetQuestionsSchema = z.object({
  flow_id: z.string().uuid(),
  sport: z.string(),
  age_group: z.string()
});

const GenerateQuestionsSchema = z.object({
  flow_id: z.string().uuid(),
  team_name: z.string(),
  sport: z.string(),
  age_group: z.string(),
  round1_answers: z.record(z.any())
});

// GET /api/questions - Get question set for a flow
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedData = GetQuestionsSchema.parse({
      flow_id: searchParams.get('flow_id'),
      sport: searchParams.get('sport'),
      age_group: searchParams.get('age_group')
    });

    // First, try to get a predefined question set
    const { data: questionSet, error: qsError } = await supabase
      .from('question_sets')
      .select('*')
      .eq('active', true)
      .or(`sport.eq.${validatedData.sport},sport.is.null`)
      .or(`age_group.eq.${validatedData.age_group},age_group.is.null`)
      .order('sort_order')
      .limit(1)
      .single();

    if (qsError || !questionSet) {
      // Fallback to generic question set
      const { data: fallbackSet, error: fallbackError } = await supabase
        .from('question_sets')
        .select('*')
        .eq('name', 'generic_fallback')
        .eq('active', true)
        .single();

      if (fallbackError || !fallbackSet) {
        console.error('No question sets available:', fallbackError);
        return NextResponse.json(
          { error: 'No question sets available' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          question_set_id: fallbackSet.id,
          questions: fallbackSet.questions,
          is_generated: fallbackSet.is_generated
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        question_set_id: questionSet.id,
        questions: questionSet.questions,
        is_generated: questionSet.is_generated
      }
    });

  } catch (error) {
    console.error('Error in GET /api/questions:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/questions/generate - Generate AI questions for Round 2
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = GenerateQuestionsSchema.parse(body);

    // Get the question generation prompt
    const { data: prompt, error: promptError } = await supabase
      .from('logo_prompts')
      .select('*')
      .eq('name', 'question_generation')
      .eq('active', true)
      .single();

    if (promptError || !prompt) {
      console.error('Question generation prompt not found:', promptError);
      return NextResponse.json(
        { error: 'Question generation not available' },
        { status: 500 }
      );
    }

    // Prepare the prompt with team data
    const promptText = prompt.prompt_text
      .replace('{team}', validatedData.team_name)
      .replace('{sport}', validatedData.sport)
      .replace('{age}', validatedData.age_group);

    // Generate questions using GPT-4o-mini for cost efficiency
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates team logo questionnaire questions. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: promptText
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let generatedQuestions;
    try {
      generatedQuestions = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse generated questions:', parseError);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the generated questions structure
    const questionsSchema = z.array(z.object({
      id: z.string(),
      text: z.string(),
      type: z.enum(['multiple_choice', 'text']),
      options: z.array(z.string()).optional(),
      selected: z.number().optional().default(0),
      required: z.boolean().optional().default(true)
    }));

    const validatedQuestions = questionsSchema.parse(generatedQuestions);

    // Save the generated question set
    const { data: questionSet, error: saveError } = await supabase
      .from('question_sets')
      .insert({
        name: `generated_${validatedData.flow_id}`,
        sport: validatedData.sport,
        age_group: validatedData.age_group,
        questions: validatedQuestions,
        is_generated: true,
        generation_prompt: promptText,
        generation_model: 'gpt-4o-mini',
        active: true
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving generated questions:', saveError);
      return NextResponse.json(
        { error: 'Failed to save generated questions' },
        { status: 500 }
      );
    }

    // Log debug information
    await logDebug(validatedData.flow_id, 'info', 'question_generation', 'AI questions generated', {
      question_count: validatedQuestions.length,
      sport: validatedData.sport,
      age_group: validatedData.age_group,
      question_set_id: questionSet.id
    });

    return NextResponse.json({
      success: true,
      data: {
        question_set_id: questionSet.id,
        questions: validatedQuestions,
        is_generated: true
      }
    });

  } catch (error) {
    console.error('Error in POST /api/questions/generate:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
