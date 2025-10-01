import OpenAI from 'openai';
import { Question } from '../shared/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIService {
  static async analyzeImage(imageBase64: string): Promise<{ analysis: string; questions: Question[] }> {
    console.log('Analyzing image with OpenAI');
    console.log('Image base64 length:', imageBase64?.length ?? 0);
  
    // Minimal guard
    if (!imageBase64 || imageBase64.length < 50) {
      throw new Error('Invalid image payload');
    }
  
    const response = await openai.chat.completions.create({
      model: "gpt-5",
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
      // seed: 1, // uncomment for reproducible debugging
    });

    console.log('Response from OpenAI:', response.choices);
  
    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('No response from OpenAI');
  
    let parsed: { analysis: string; questions: Array<{ text: string; options: string[]; required: boolean }> };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Helpful debug log; don’t throw the raw content to clients
      console.error('Failed to JSON.parse model output:', raw);
      throw new Error('Failed to parse JSON from OpenAI');
    }
  
    // Lightweight validation
    if (!parsed.analysis || !Array.isArray(parsed.questions) || parsed.questions.length !== 10) {
      throw new Error('Model output is missing analysis or exactly 10 questions');
    }
  
    const questions: Question[] = parsed.questions.map((q, i) => ({
      id: `q_${i}`,
      text: q.text,
      type: 'multiple_choice' as const,
      options: q.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      required: true,
    }));
  
    return { analysis: parsed.analysis, questions };
  }
  

  static async generateImage(prompt: string): Promise<string> {
    try {
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "high"
        // gpt-image-1 returns URLs by default, no response_format parameter supported
      });

      const imageData = response.data[0];
      if (!imageData) {
        throw new Error('No image generated');
      }

      // gpt-image-1 returns URLs, so we need to download and convert to base64
      if (imageData.url) {
        const imageResponse = await fetch(imageData.url);
        if (!imageResponse.ok) {
          throw new Error('Failed to download generated image');
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        return Buffer.from(imageBuffer).toString('base64');
      } else if (imageData.b64_json) {
        // Fallback for base64 response (if supported in future)
        return imageData.b64_json;
      } else {
        throw new Error('No image data returned');
      }
    } catch (error) {
      console.error('OpenAI image generation error:', error);
      throw new Error('Failed to generate image');
    }
  }

  static async createImagePrompt(questions: Question[], answers: string[]): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
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
      });

      return response.choices[0]?.message?.content || 'A creative image based on the provided answers';
    } catch (error) {
      console.error('OpenAI prompt creation error:', error);
      return 'A creative image based on the provided answers';
    }
  }
}
