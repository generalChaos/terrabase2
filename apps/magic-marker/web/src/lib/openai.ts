import OpenAI from 'openai';
import { Question } from './types';
import { PromptService } from './promptService';
import { StepService } from './stepService';

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

// Feature flag for database prompts (set to false to use hardcoded prompts)
const USE_DATABASE_PROMPTS = process.env.USE_DATABASE_PROMPTS === 'true' || false;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export class OpenAIService {
  static async analyzeImage(imageBase64: string, imageId?: string): Promise<{ analysis: string }> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`🤖 [${requestId}] Analyzing image with OpenAI`);
    console.log(`📊 [${requestId}] Image base64 length:`, imageBase64?.length ?? 0);
    console.log(`🔧 [${requestId}] Using database prompts:`, USE_DATABASE_PROMPTS);
  
    // Get OpenAI client (validates API key)
    const openai = getOpenAIClient();
  
    // Validate image payload
    if (!imageBase64 || imageBase64.length < 50) {
      throw new Error('Invalid image payload - image too small or empty');
    }
    
    // Validate base64 format
    try {
      Buffer.from(imageBase64, 'base64');
    } catch (error) {
      throw new Error('Invalid base64 image format');
    }

    // Get analysis prompt from database or use hardcoded fallback
    let promptText: string;
    let promptId: string | null = null;
    
    if (USE_DATABASE_PROMPTS) {
      console.log(`🔍 [${requestId}] Retrieving analysis prompt from database...`);
      const prompt = await PromptService.getPrompt('image_analysis');
      if (prompt) {
        promptText = prompt.content;
        promptId = prompt.id;
        console.log(`✅ [${requestId}] Using database prompt for image analysis`);
        console.log(`📝 [${requestId}] Prompt ID:`, promptId);
        console.log(`📏 [${requestId}] Prompt length:`, promptText.length);
      } else {
        console.warn(`⚠️ [${requestId}] Database prompt not found, falling back to hardcoded prompt`);
        promptText = this.getHardcodedImageAnalysisPrompt();
      }
    } else {
      promptText = this.getHardcodedImageAnalysisPrompt();
      console.log(`🔧 [${requestId}] Using hardcoded prompt for image analysis`);
    }
  
    const startTime = Date.now();
    let response;
    let tokensUsed: number | undefined;
    
    try {
      console.log(`🚀 [${requestId}] Making OpenAI API call for image analysis...`);
      console.log(`📝 [${requestId}] PROMPT:`, promptText);
      
      response = await openai.chat.completions.create({
        model: "gpt-4o", // Using gpt-4o instead of gpt-5 for better availability
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptText
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }, // <- forces valid JSON
        max_completion_tokens: 2000,
        // seed: 1, // uncomment for reproducible debugging
      });
      
      tokensUsed = response.usage?.total_tokens;
      const rawResponse = response.choices[0]?.message?.content;
      console.log(`📄 [${requestId}] RESPONSE:`, rawResponse);
    } catch (error: unknown) {
      console.error(`❌ [${requestId}] OpenAI API error:`, error);
      
      // Handle specific OpenAI errors
      const errorObj = error as { code?: string; message?: string; status?: number };
      if (errorObj.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
      } else if (errorObj.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your account billing.');
      } else if (errorObj.code === 'model_not_found') {
        throw new Error('OpenAI model not available. Please try again later.');
      } else if (errorObj.code === 'timeout') {
        throw new Error('OpenAI request timed out. Please try again.');
      } else if (errorObj.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      } else if (errorObj.status === 429) {
        throw new Error('Too many requests to OpenAI. Please wait and try again.');
      } else if (errorObj.status && errorObj.status >= 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`OpenAI API error: ${errorObj.message || 'Unknown error'}`);
      }
    }

    console.log(`📥 [${requestId}] Response from OpenAI:`, response.choices?.length || 0, 'choices');
    
    const responseTime = Date.now() - startTime;
    
    // Log the conversation if we have a prompt ID
    if (promptId) {
      await PromptService.logConversation({
        prompt_id: promptId,
        input_data: { image_base64_length: imageBase64.length },
        output_data: response.choices[0]?.message?.content,
        response_time_ms: responseTime,
        tokens_used: tokensUsed,
        model_used: 'gpt-4o',
        success: true
      });
    }
  
    const raw = response.choices[0]?.message?.content;
    console.log(`📄 [${requestId}] Raw response length:`, raw?.length || 0);
    if (!raw) {
      console.error(`❌ [${requestId}] No response content from OpenAI`);
      
      // Log the error if we have a prompt ID
      if (promptId) {
        await PromptService.logConversation({
          prompt_id: promptId,
          input_data: { image_base64_length: imageBase64.length },
          output_data: null,
          response_time_ms: responseTime,
          tokens_used: tokensUsed,
          model_used: 'gpt-4o',
          success: false,
          error_message: 'No response content from OpenAI'
        });
      }
      
      throw new Error('No response from OpenAI');
    }
  
    let parsed: { analysis: string; questions: Array<{ text: string; options: string[]; required: boolean }> };
    try {
      console.log(`🔍 [${requestId}] Parsing JSON response...`);
      parsed = JSON.parse(raw);
      console.log(`✅ [${requestId}] JSON parsing successful`);
    } catch (parseError) {
      // Helpful debug log; don't throw the raw content to clients
      console.error(`❌ [${requestId}] Failed to JSON.parse model output:`, raw);
      console.error(`❌ [${requestId}] Parse error:`, parseError);
      throw new Error('Failed to parse JSON from OpenAI - invalid response format');
    }
  
    // Comprehensive validation
    console.log(`🔍 [${requestId}] Validating response structure...`);
    if (!parsed.analysis || typeof parsed.analysis !== 'string' || parsed.analysis.trim().length === 0) {
      console.error(`❌ [${requestId}] Invalid analysis from OpenAI - analysis is missing or empty`);
      throw new Error('Invalid analysis from OpenAI - analysis is missing or empty');
    }
    
    if (!Array.isArray(parsed.questions)) {
      console.error(`❌ [${requestId}] Invalid questions from OpenAI - questions must be an array`);
      throw new Error('Invalid questions from OpenAI - questions must be an array');
    }
    
    // Validate question count - warn if 0, error if no fallback available
    console.log(`❓ [${requestId}] OpenAI returned ${parsed.questions.length} questions`);
    
    if (parsed.questions.length === 0) {
      console.warn('OpenAI returned 0 questions - this may indicate a prompt issue');
      if (!USE_DATABASE_PROMPTS) {
        throw new Error('OpenAI returned 0 questions and no database fallback available');
      }
      // If using database prompts, we could potentially retry with a different prompt
      throw new Error('OpenAI returned 0 questions - please check the prompt configuration');
    }
    
    if (parsed.questions.length < 3) {
      console.warn(`OpenAI returned only ${parsed.questions.length} questions - this may be insufficient`);
    }
    
    if (parsed.questions.length > 15) {
      console.warn(`OpenAI returned ${parsed.questions.length} questions - this may be too many for good UX`);
    }
    
    // Validate each question
    for (let i = 0; i < parsed.questions.length; i++) {
      const q = parsed.questions[i];
      if (!q.text || typeof q.text !== 'string' || q.text.trim().length === 0) {
        throw new Error(`Invalid question ${i + 1} - text is missing or empty`);
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        throw new Error(`Invalid question ${i + 1} - must have at least 2 options, got ${q.options?.length || 0}`);
      }
      
      if (q.options.length > 6) {
        console.warn(`Question ${i + 1} has ${q.options.length} options - this may be too many for good UX`);
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j] || typeof q.options[j] !== 'string' || q.options[j].trim().length === 0) {
          throw new Error(`Invalid question ${i + 1}, option ${j + 1} - option text is missing or empty`);
        }
      }
    }
  
    const questions: Question[] = parsed.questions.map((q, i) => ({
      id: `q_${i}`,
      text: q.text.trim(),
      type: 'multiple_choice' as const,
      options: q.options.map(opt => opt.trim()),
      required: true,
    }));
  
    console.log(`🎉 [${requestId}] Analysis completed successfully!`);
    console.log(`📊 [${requestId}] Final analysis length:`, parsed.analysis.trim().length);
    console.log(`❓ [${requestId}] Final questions count:`, questions.length);
    
    // Log questions generation step if imageId is provided
    if (imageId) {
      console.log(`📊 [${requestId}] Logging questions generation step...`);
      await StepService.logStep({
        image_id: imageId,
        step_type: 'questions',
        step_order: 2,
        prompt_id: promptId || undefined,
        prompt_content: promptText,
        input_data: { analysis: parsed.analysis.trim() },
        output_data: { questions },
        response_time_ms: responseTime,
        tokens_used: tokensUsed,
        model_used: 'gpt-4o',
        success: true
      });
    }
    
    return { analysis: parsed.analysis.trim() };
  }

  /**
   * Generate a single conversational question based on context
   */
  static async generateConversationalQuestion(
    analysis: string, 
    previousAnswers: string[] = [],
    conversationContext?: {
      questions: Array<{
        text: string
        answer?: string
        context?: {
          reasoning: string
          builds_on: string
          artistic_focus: string
        }
      }>
      artisticDirection?: string
    },
    imageId?: string
  ): Promise<{ question: Question; context: { reasoning: string; builds_on: string; artistic_focus: string } }> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`💬 [${requestId}] Generating conversational question`, {
      analysisLength: analysis.length,
      previousAnswersCount: previousAnswers.length,
      conversationContextQuestions: conversationContext?.questions?.length || 0,
      artisticDirection: conversationContext?.artisticDirection,
      imageId: imageId?.substring(0, 8) + '...'
    });
    
    // Get OpenAI client (validates API key)
    const openai = getOpenAIClient();
    
    // Get conversational prompt from database
    let promptText: string;
    let promptId: string | null = null;
    
    if (USE_DATABASE_PROMPTS) {
      console.log(`🔍 [${requestId}] Retrieving conversational prompt from database...`);
      const prompt = await PromptService.getPrompt('conversational_questions');
      if (prompt) {
        promptText = prompt.content;
        promptId = prompt.id;
        console.log(`✅ [${requestId}] Using database prompt for conversational questions`, {
          promptId: promptId.substring(0, 8) + '...',
          promptLength: promptText.length
        });
      } else {
        console.error(`❌ [${requestId}] Conversational questions prompt not found in database`);
        throw new Error('Conversational questions prompt not found in database');
      }
    } else {
      console.error(`❌ [${requestId}] Database prompts must be enabled for conversational questions`);
      throw new Error('Database prompts must be enabled for conversational questions');
    }

    // Build comprehensive context for the prompt
    let contextInfo = '';
    
    if (conversationContext?.questions && conversationContext.questions.length > 0) {
      const questionHistory = conversationContext.questions.map((q, index) => 
        `Q${index + 1}: ${q.text}\nAnswer: ${q.answer || 'Not answered'}\nContext: ${q.context?.reasoning || 'N/A'}`
      ).join('\n\n');
      
      contextInfo += `\n\nPrevious Questions and Answers:\n${questionHistory}`;
    } else if (previousAnswers.length > 0) {
      contextInfo += `\n\nPrevious answers: ${previousAnswers.join(', ')}`;
    }
    
    if (conversationContext?.artisticDirection) {
      contextInfo += `\n\nCurrent artistic direction: ${conversationContext.artisticDirection}`;
    }
    
    // Add image analysis to context
    const fullContext = `Image Analysis: ${analysis}${contextInfo}`;

    console.log(`📝 [${requestId}] Built context for prompt`, {
      contextInfoLength: contextInfo.length,
      fullContextLength: fullContext.length,
      hasImageAnalysis: !!analysis,
      hasPreviousAnswers: previousAnswers.length > 0,
      hasConversationContext: !!conversationContext
    });

    const startTime = Date.now();
    let response;
    let tokensUsed: number | undefined;

    try {
      console.log(`🤖 [${requestId}] Calling OpenAI API for conversational question...`);
      console.log(`📝 [${requestId}] SYSTEM PROMPT:`, promptText);
      console.log(`📊 [${requestId}] USER CONTEXT:`, fullContext);
      
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: promptText
          },
          {
            role: 'user',
            content: fullContext
          }
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 1000,
        temperature: 0.8
      });

      tokensUsed = response.usage?.completion_tokens;
      const rawResponse = response.choices[0]?.message?.content;
      console.log(`📄 [${requestId}] RESPONSE:`, rawResponse);
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to generate conversational question:`, error);
      throw error;
    }

    const responseTime = Date.now() - startTime;
    const raw = response.choices[0]?.message?.content;
    
    console.log(`📄 [${requestId}] Raw response from OpenAI:`, {
      responseLength: raw?.length || 0,
      hasResponse: !!raw
    });
    
    if (!raw) {
      console.error(`❌ [${requestId}] No response from OpenAI for conversational question`);
      throw new Error('No response from OpenAI for conversational question');
    }

    let parsed: { question: { text: string; options: string[]; required: boolean }; context: { reasoning: string; builds_on: string; artistic_focus: string } };
    try {
      console.log(`🔍 [${requestId}] Parsing JSON response...`);
      parsed = JSON.parse(raw);
      console.log(`✅ [${requestId}] JSON parsed successfully`, {
        hasQuestion: !!parsed.question,
        hasContext: !!parsed.context,
        questionText: parsed.question?.text?.substring(0, 50) + '...',
        optionsCount: parsed.question?.options?.length || 0
      });
    } catch (parseError) {
      console.error(`❌ [${requestId}] Failed to parse conversational question response:`, raw);
      throw new Error('Invalid JSON response from OpenAI for conversational question');
    }

    // Validate response structure
    if (!parsed.question || !parsed.question.text || !parsed.question.options) {
      console.error(`❌ [${requestId}] Invalid conversational question response structure:`, parsed);
      throw new Error('Invalid conversational question response structure');
    }

    const question: Question = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      text: parsed.question.text,
      type: 'multiple_choice',
      options: parsed.question.options,
      required: parsed.question.required ?? true
    };

    console.log(`🎯 [${requestId}] Question created successfully`, {
      questionId: question.id,
      questionText: question.text.substring(0, 50) + '...',
      optionsCount: question.options.length,
      required: question.required
    });

    // Log the step if imageId is provided
    if (imageId) {
      try {
        console.log(`📊 [${requestId}] Logging conversational question step...`);
        await StepService.logStep({
          image_id: imageId,
          step_type: 'conversational_question',
          step_order: 0, // Will be updated by conversation service
          prompt_id: promptId,
          prompt_content: promptText,
          input_data: { analysis, previousAnswers },
          output_data: { question, context: parsed.context },
          response_time_ms: responseTime,
          tokens_used: tokensUsed,
          model_used: 'gpt-4o',
          success: true
        });
        console.log(`✅ [${requestId}] Step logged successfully`);
      } catch (logError) {
        console.warn(`⚠️ [${requestId}] Failed to log conversational question step:`, logError);
      }
    }

    // Log conversation to database
    if (promptId) {
      console.log(`📊 [${requestId}] Logging conversation to database...`);
      try {
        await PromptService.logConversation({
          prompt_id: promptId,
          input_data: {
            analysis_length: analysis.length,
            previous_answers_count: previousAnswers.length,
            conversation_context_questions: conversationContext?.questions?.length || 0,
            artistic_direction: conversationContext?.artisticDirection
          },
          output_data: {
            question_text: question.text,
            question_options: question.options,
            context: parsed.context
          },
          response_time_ms: responseTime,
          tokens_used: tokensUsed,
          model_used: 'gpt-4o',
          success: true
        });
        console.log(`✅ [${requestId}] Conversation logged successfully`);
      } catch (logError) {
        console.warn(`⚠️ [${requestId}] Failed to log conversation:`, logError);
      }
    } else {
      console.log(`ℹ️ [${requestId}] No prompt ID available, skipping conversation logging`);
    }

    console.log(`🎉 [${requestId}] Conversational question generation completed successfully`);
    return { question, context: parsed.context };
  }

  /**
   * Generate questions from image analysis (Step 2)
   */
  static async generateQuestions(analysis: string, imageId?: string): Promise<Question[]> {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`❓ [${requestId}] Generating questions from analysis`);
    
    // Get OpenAI client (validates API key)
    const openai = getOpenAIClient();
    
    // Get prompt from database or use hardcoded fallback
    let promptText: string;
    let promptId: string | null = null;
    
    if (USE_DATABASE_PROMPTS) {
      console.log(`🔍 [${requestId}] Retrieving questions prompt from database...`);
      const prompt = await PromptService.getPrompt('questions_generation');
      if (prompt) {
        promptText = prompt.content;
        promptId = prompt.id;
        console.log(`✅ [${requestId}] Using database prompt for questions generation`);
      } else {
        console.warn(`⚠️ [${requestId}] Questions prompt not found, using analysis prompt`);
        const analysisPrompt = await PromptService.getPrompt('image_analysis');
        if (analysisPrompt) {
          promptText = analysisPrompt.content;
          promptId = analysisPrompt.id;
        } else {
          promptText = this.getHardcodedQuestionsPrompt();
        }
      }
    } else {
      promptText = this.getHardcodedQuestionsPrompt();
      console.log(`🔧 [${requestId}] Using hardcoded prompt for questions generation`);
    }

    const startTime = Date.now();
    let response;
    let tokensUsed: number | undefined;
    
    try {
      console.log(`🚀 [${requestId}] Making OpenAI API call for questions...`);
      console.log(`📝 [${requestId}] PROMPT:`, promptText);
      console.log(`📊 [${requestId}] ANALYSIS:`, analysis);
      
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `${promptText}\n\nImage Analysis: ${analysis}`
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
      });
      
      tokensUsed = response.usage?.total_tokens;
      const rawResponse = response.choices[0]?.message?.content;
      console.log(`📄 [${requestId}] RESPONSE:`, rawResponse);
    } catch (error: unknown) {
      console.error(`❌ [${requestId}] OpenAI questions API error:`, error);
      const errorObj = error as { code?: string; message?: string; status?: number };
      if (errorObj.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
      } else if (errorObj.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your account billing.');
      } else if (errorObj.code === 'model_not_found') {
        throw new Error('OpenAI model not available. Please try again later.');
      } else if (errorObj.code === 'timeout') {
        throw new Error('OpenAI request timed out. Please try again.');
      } else if (errorObj.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      } else if (errorObj.status === 429) {
        throw new Error('Too many requests to OpenAI. Please wait and try again.');
      } else if (errorObj.status && errorObj.status >= 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`OpenAI API error: ${errorObj.message || 'Unknown error'}`);
      }
    }

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ [${requestId}] Questions generation completed in ${responseTime}ms`);

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI for questions generation');
    }

    let parsed: { questions: Question[] };
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to parse questions JSON:`, content);
      throw new Error('Invalid JSON response from OpenAI for questions generation');
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid questions format from OpenAI - questions array is missing');
    }

    // Validate questions count
    if (parsed.questions.length === 0) {
      console.warn('OpenAI returned 0 questions - this may indicate an issue');
      if (USE_DATABASE_PROMPTS) {
        throw new Error('No questions generated and no fallback available');
      }
    } else if (parsed.questions.length < 3) {
      console.warn(`OpenAI returned only ${parsed.questions.length} questions - this may be too few for good UX`);
    } else if (parsed.questions.length > 15) {
      console.warn(`OpenAI returned ${parsed.questions.length} questions - this may be too many for good UX`);
    }
    
    // Validate each question
    for (let i = 0; i < parsed.questions.length; i++) {
      const q = parsed.questions[i];
      if (!q.text || typeof q.text !== 'string' || q.text.trim().length === 0) {
        throw new Error(`Invalid question ${i + 1} - text is missing or empty`);
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        throw new Error(`Invalid question ${i + 1} - must have at least 2 options, got ${q.options?.length || 0}`);
      }
      
      if (q.options.length > 6) {
        console.warn(`Question ${i + 1} has ${q.options.length} options - this may be too many for good UX`);
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j] || typeof q.options[j] !== 'string' || q.options[j].trim().length === 0) {
          throw new Error(`Invalid question ${i + 1}, option ${j + 1} - option text is missing or empty`);
        }
      }
    }
  
    const questions: Question[] = parsed.questions.map((q, i) => ({
      id: `q_${i}`,
      text: q.text.trim(),
      type: 'multiple_choice' as const,
      options: q.options.map(opt => opt.trim()),
      required: true,
    }));
  
    console.log(`🎉 [${requestId}] Questions generation completed successfully!`);
    console.log(`❓ [${requestId}] Final questions count:`, questions.length);
    
    // Log questions generation step if imageId is provided
    if (imageId) {
      console.log(`📊 [${requestId}] Logging questions generation step...`);
      await StepService.logStep({
        image_id: imageId,
        step_type: 'questions',
        step_order: 2,
        prompt_id: promptId || undefined,
        prompt_content: promptText,
        input_data: { analysis },
        output_data: { questions },
        response_time_ms: responseTime,
        tokens_used: tokensUsed,
        model_used: 'gpt-4o',
        success: true
      });
    }
    
    return questions;
  }
  

  static async generateImage(prompt: string): Promise<string> {
    // Get OpenAI client (validates API key)
    const openai = getOpenAIClient();
    
    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Invalid prompt - prompt is missing or empty');
    }
    
    if (prompt.length > 4000) {
      throw new Error('Prompt too long - maximum 4000 characters allowed');
    }
    
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt.trim(),
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        console.error('No image URL in OpenAI response:', response);
        throw new Error('No image generated - empty response from OpenAI');
      }

      return imageUrl;
    } catch (error: unknown) {
      console.error('OpenAI image generation error:', error);
      
      // Handle specific OpenAI errors
      const errorObj = error as { code?: string; message?: string; status?: number };
      if (errorObj.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
      } else if (errorObj.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your account billing.');
      } else if (errorObj.code === 'content_policy_violation') {
        throw new Error('Image generation blocked due to content policy. Please try different answers.');
      } else if (errorObj.code === 'timeout') {
        throw new Error('Image generation timed out. Please try again.');
      } else if (errorObj.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      } else if (errorObj.status === 429) {
        throw new Error('Too many requests to OpenAI. Please wait and try again.');
      } else if (errorObj.status && errorObj.status >= 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Image generation failed: ${errorObj.message || 'Unknown error'}`);
      }
    }
  }

  static async createImagePrompt(questions: Question[], answers: string[], imageId?: string): Promise<string> {
    // Get OpenAI client (validates API key)
    const openai = getOpenAIClient();
    
    // Validate inputs
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions - questions array is missing or empty');
    }
    
    if (!Array.isArray(answers) || answers.length === 0) {
      throw new Error('Invalid answers - answers array is missing or empty');
    }
    
    if (questions.length !== answers.length) {
      throw new Error(`Mismatch between questions (${questions.length}) and answers (${answers.length}) count`);
    }

    // Get prompts from database or use hardcoded fallback
    let systemPrompt: string;
    let userPrompt: string;
    let promptId: string | null = null;
    
    if (USE_DATABASE_PROMPTS) {
      const systemPromptData = await PromptService.getPrompt('image_prompt_creation_system');
      const userPromptData = await PromptService.getPrompt('image_prompt_creation_user');
      
      if (systemPromptData && userPromptData) {
        systemPrompt = systemPromptData.content;
        userPrompt = PromptService.replaceTemplateVariables(
          userPromptData.content,
          { questions_and_answers: questions.map((q, i) => `${q.text}: ${answers[i]}`).join('\n') }
        );
        promptId = systemPromptData.id; // Use system prompt ID for logging
        console.log('Using database prompts for image prompt creation');
      } else {
        console.warn('Database prompts not found, falling back to hardcoded prompts');
        systemPrompt = this.getHardcodedSystemPrompt();
        userPrompt = this.getHardcodedUserPrompt(questions, answers);
      }
    } else {
      systemPrompt = this.getHardcodedSystemPrompt();
      userPrompt = this.getHardcodedUserPrompt(questions, answers);
      console.log('Using hardcoded prompts for image prompt creation');
    }
    
    const startTime = Date.now();
    let tokensUsed: number | undefined;
    
    try {
      console.log(`🚀 [ImageGen] Making OpenAI API call for image prompt generation...`);
      console.log(`📝 [ImageGen] SYSTEM PROMPT:`, systemPrompt);
      console.log(`📊 [ImageGen] USER PROMPT:`, userPrompt);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: 300,
      });
      
      tokensUsed = response.usage?.total_tokens;
      const prompt = response.choices[0]?.message?.content;
      console.log(`📄 [ImageGen] RESPONSE:`, prompt);
      
      // Log the conversation if we have a prompt ID
      if (promptId) {
        await PromptService.logConversation({
          prompt_id: promptId,
          input_data: { questions_count: questions.length, answers_count: answers.length },
          output_data: prompt,
          response_time_ms: responseTime,
          tokens_used: tokensUsed,
          model_used: 'gpt-4o',
          success: true
        });
      }
      
      if (!prompt || prompt.trim().length === 0) {
        console.warn('Empty prompt from OpenAI, using fallback');
        return 'A creative image based on the provided answers';
      }

      // Log image generation step if imageId is provided
      if (imageId) {
        console.log('📊 Logging image generation step...');
        await StepService.logStep({
          image_id: imageId,
          step_type: 'image_generation',
          step_order: 4,
          prompt_id: promptId || undefined,
          prompt_content: userPrompt,
          input_data: { questions, answers },
          output_data: { prompt: prompt.trim() },
          response_time_ms: responseTime,
          tokens_used: tokensUsed,
          model_used: 'gpt-4o',
          success: true
        });
      }

      return prompt.trim();
    } catch (error: unknown) {
      console.error('OpenAI prompt creation error:', error);
      
      // Handle specific OpenAI errors
      const errorObj = error as { code?: string; message?: string; status?: number };
      if (errorObj.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
      } else if (errorObj.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your account billing.');
      } else if (errorObj.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      } else if (errorObj.status === 429) {
        throw new Error('Too many requests to OpenAI. Please wait and try again.');
      } else if (errorObj.status && errorObj.status >= 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else {
        // For prompt creation, we can fall back to a default prompt
        console.warn('OpenAI prompt creation failed, using fallback:', errorObj.message);
        return 'A creative image based on the provided answers';
      }
    }
  }

  /**
   * Get the hardcoded image analysis prompt (fallback)
   */
  private static getHardcodedImageAnalysisPrompt(): string {
    return `Analyze this image and return ONLY JSON with this exact schema:
    
    {
      "analysis": "2–3 sentences describing what you see."
    }
    
    Rules:
    - No extra keys. No preamble. No markdown. Only JSON.`;
  }

  /**
   * Get the hardcoded questions generation prompt (fallback)
   */
  private static getHardcodedQuestionsPrompt(): string {
    return `Based on the image analysis provided, generate exactly 8 creative questions that will help create an artistic image prompt. Return ONLY JSON with this exact schema:

{
  "questions": [
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true}
  ]
}

Rules:
- Generate exactly 8 questions
- Each question must have exactly 4 multiple choice options
- Questions should be about artistic style, mood, composition, colors, etc.
- required is always true
    - No extra keys. No preamble. No markdown. Only JSON.`;
  }

  /**
   * Get the hardcoded system prompt for image prompt creation (fallback)
   */
  private static getHardcodedSystemPrompt(): string {
    return "You are a creative AI that generates image prompts. Create a detailed, artistic prompt based on the questions and answers provided.";
  }

  /**
   * Get the hardcoded user prompt for image prompt creation (fallback)
   */
  private static getHardcodedUserPrompt(questions: Question[], answers: string[]): string {
    return `Based on these questions and answers, create a detailed image generation prompt for DALL-E 3:
            
            Questions and Answers:
            ${questions.map((q, i) => `${q.text}: ${answers[i]}`).join('\n')}
            
            Generate a creative, detailed prompt that incorporates all the answers. Focus on visual elements, style, mood, and composition. Make it specific and artistic.`;
  }
}
