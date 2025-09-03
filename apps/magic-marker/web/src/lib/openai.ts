import OpenAI from 'openai';
import { Question } from './types';

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

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
  static async analyzeImage(imageBase64: string): Promise<{ analysis: string; questions: Question[] }> {
    console.log('Analyzing image with OpenAI');
    console.log('Image base64 length:', imageBase64?.length ?? 0);
  
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
  
    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o", // Using gpt-4o instead of gpt-5 for better availability
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
    `Analyze this image and return ONLY JSON with this exact schema:
    
    {
      "analysis": "2–3 sentences describing what you see.",
      "questions": [
        {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
        ... exactly 10 items total ...
      ]
    }
    
    Rules:
    - questions MUST be exactly 10 items.
    - Each question must have exactly 4 multiple choice options.
    - required is always true.
    - No extra keys. No preamble. No markdown. Only JSON.`
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
        timeout: 30000, // 30 second timeout
        // seed: 1, // uncomment for reproducible debugging
      });
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      // Handle specific OpenAI errors
      if (error.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
      } else if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your account billing.');
      } else if (error.code === 'model_not_found') {
        throw new Error('OpenAI model not available. Please try again later.');
      } else if (error.code === 'timeout') {
        throw new Error('OpenAI request timed out. Please try again.');
      } else if (error.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      } else if (error.status === 429) {
        throw new Error('Too many requests to OpenAI. Please wait and try again.');
      } else if (error.status >= 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`);
      }
    }

    console.log('Response from OpenAI:', response.choices);
  
    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      console.error('No response content from OpenAI');
      throw new Error('No response from OpenAI');
    }
  
    let parsed: { analysis: string; questions: Array<{ text: string; options: string[]; required: boolean }> };
    try {
      parsed = JSON.parse(raw);
    } catch (parseError) {
      // Helpful debug log; don't throw the raw content to clients
      console.error('Failed to JSON.parse model output:', raw);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse JSON from OpenAI - invalid response format');
    }
  
    // Comprehensive validation
    if (!parsed.analysis || typeof parsed.analysis !== 'string' || parsed.analysis.trim().length === 0) {
      throw new Error('Invalid analysis from OpenAI - analysis is missing or empty');
    }
    
    if (!Array.isArray(parsed.questions)) {
      throw new Error('Invalid questions from OpenAI - questions must be an array');
    }
    
    if (parsed.questions.length !== 10) {
      throw new Error(`Invalid questions from OpenAI - expected 10 questions, got ${parsed.questions.length}`);
    }
    
    // Validate each question
    for (let i = 0; i < parsed.questions.length; i++) {
      const q = parsed.questions[i];
      if (!q.text || typeof q.text !== 'string' || q.text.trim().length === 0) {
        throw new Error(`Invalid question ${i + 1} - text is missing or empty`);
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Invalid question ${i + 1} - must have exactly 4 options`);
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
  
    return { analysis: parsed.analysis.trim(), questions };
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
        timeout: 60000, // 60 second timeout for image generation
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        console.error('No image URL in OpenAI response:', response);
        throw new Error('No image generated - empty response from OpenAI');
      }

      return imageUrl;
    } catch (error: any) {
      console.error('OpenAI image generation error:', error);
      
      // Handle specific OpenAI errors
      if (error.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
      } else if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your account billing.');
      } else if (error.code === 'content_policy_violation') {
        throw new Error('Image generation blocked due to content policy. Please try different answers.');
      } else if (error.code === 'timeout') {
        throw new Error('Image generation timed out. Please try again.');
      } else if (error.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      } else if (error.status === 429) {
        throw new Error('Too many requests to OpenAI. Please wait and try again.');
      } else if (error.status >= 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Image generation failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  static async createImagePrompt(questions: Question[], answers: string[]): Promise<string> {
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
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a creative AI that generates image prompts. Create a detailed, artistic prompt based on the questions and answers provided."
          },
          {
            role: "user",
            content: `Based on these questions and answers, create a detailed image generation prompt for DALL-E 3:
            
            Questions and Answers:
            ${questions.map((q, i) => `${q.text}: ${answers[i]}`).join('\n')}
            
            Generate a creative, detailed prompt that incorporates all the answers. Focus on visual elements, style, mood, and composition. Make it specific and artistic.`
          }
        ],
        max_tokens: 300,
        timeout: 30000, // 30 second timeout
      });

      const prompt = response.choices[0]?.message?.content;
      if (!prompt || prompt.trim().length === 0) {
        console.warn('Empty prompt from OpenAI, using fallback');
        return 'A creative image based on the provided answers';
      }

      return prompt.trim();
    } catch (error: any) {
      console.error('OpenAI prompt creation error:', error);
      
      // Handle specific OpenAI errors
      if (error.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
      } else if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI quota exceeded. Please check your account billing.');
      } else if (error.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      } else if (error.status === 429) {
        throw new Error('Too many requests to OpenAI. Please wait and try again.');
      } else if (error.status >= 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else {
        // For prompt creation, we can fall back to a default prompt
        console.warn('OpenAI prompt creation failed, using fallback:', error.message);
        return 'A creative image based on the provided answers';
      }
    }
  }
}
