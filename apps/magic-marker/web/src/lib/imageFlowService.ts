import { SimpleImageService } from './simpleImageService';
import { Question, QuestionAnswer } from './types';
import { supabase } from './supabase';
import { SimplePromptService } from './simplePromptService';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Image generation model configuration
// Options: "dall-e-3" (available now) or "gpt-image-1" (requires organization verification)
const IMAGE_GENERATION_MODEL = "dall-e-3";

export class ImageFlowService {
  /**
   * Upload an image file and create a new flow
   */
  static async uploadImage(file: File): Promise<{ 
    success: boolean; 
    flowId?: string; 
    imagePath?: string; 
    error?: string 
  }> {
    try {
      // Validate file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!file.type || !allowedTypes.includes(file.type.toLowerCase())) {
        return { success: false, error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` };
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return { success: false, error: `File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB` };
      }

      // Generate unique filename
      const flowId = uuidv4();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${flowId}.${fileExtension}`;
      
      // Upload to Supabase storage
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase storage error:', uploadError);
        return { success: false, error: 'Failed to upload image to storage' };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      // Create images record first
      const imageId = uuidv4();
      const { data: imageData, error: imageError } = await supabase
        .from('images')
        .insert({
          id: imageId,
          file_path: publicUrl,
          image_type: 'original',
          file_size: file.size,
          mime_type: file.type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (imageError) {
        console.error('Database error creating image:', imageError);
        return { success: false, error: 'Failed to create image record' };
      }

      // Create analysis flow record
      const { data: flowData, error: flowError } = await supabase
        .from('analysis_flows')
        .insert({
          id: flowId,
          session_id: uuidv4(), // Generate a session ID
          original_image_id: imageId,
          current_step: 'upload',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

        if (flowError) {
            console.error('Database error:', flowError);
            return { success: false, error: 'Failed to create analysis flow' };
          }
    
          return {
            success: true,
            flowId: flowData.id,
            imagePath: publicUrl
          };
    
        } catch (error) {
          console.error('Upload error:', error);
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred' 
          };
        }
    }

  /**
   * Analyze an uploaded image using AI
   */
  static async analyzeImage(flowId: string): Promise<{ 
    success: boolean; 
    analysis?: string; 
    error?: string 
  }> {
    try {
      // 1. Get the flow data
      const { data: flowData, error: flowError } = await supabase
        .from('analysis_flows')
        .select('*')
        .eq('id', flowId)
        .single();

      if (flowError || !flowData) {
        return { success: false, error: 'Flow not found' };
      }

      if (!flowData.original_image_id) {
        return { success: false, error: 'No image found in flow' };
      }

      // 2. Get the image data from the images table
      const { data: imageData, error: imageError } = await supabase
        .from('images')
        .select('file_path')
        .eq('id', flowData.original_image_id)
        .single();

      if (imageError || !imageData) {
        return { success: false, error: 'Image not found in database' };
      }

      // 3. Download the image and convert to base64
      const imageResponse = await fetch(imageData.file_path);
      if (!imageResponse.ok) {
        return { success: false, error: 'Failed to download image' };
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');

      // 4. Analyze the image using OpenAI
      const result = await SimplePromptService.analyzeImage(base64Image);

      // 5. Update the flow with the analysis result
      const { error: updateError } = await supabase
        .from('analysis_flows')
        .update({
          analysis_result: result,
          updated_at: new Date().toISOString()
        })
        .eq('id', flowId);

      if (updateError) {
        console.error('Failed to update flow with analysis:', updateError);
        return { success: false, error: 'Failed to save analysis result' };
      }

      return {
        success: true,
        analysis: result
      };

    } catch (error) {
      console.error('Image analysis error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Generate questions based on the analysis
   */
  static async generateQuestions(flowId: string): Promise<{ 
    success: boolean; 
    questions?: Question[]; 
    error?: string 
  }> {
    try {
      // 1. Get the flow data with analysis result
      const { data: flowData, error: flowError } = await supabase
        .from('analysis_flows')
        .select('*')
        .eq('id', flowId)
        .single();

      if (flowError || !flowData) {
        return { success: false, error: 'Flow not found' };
      }

      if (!flowData.analysis_result) {
        return { success: false, error: 'No analysis result found. Please analyze the image first.' };
      }

      // 2. Generate questions using OpenAI
      const questions = await SimplePromptService.generateQuestions(flowData.analysis_result);

      // 4. Update the flow with the questions
      const { error: updateError } = await supabase
        .from('analysis_flows')
        .update({
          questions: questions,
          updated_at: new Date().toISOString()
        })
        .eq('id', flowId);

      if (updateError) {
        console.error('Failed to update flow with questions:', updateError);
        return { success: false, error: 'Failed to save questions' };
      }

      return {
        success: true,
        questions: questions
      };

    } catch (error) {
      console.error('Questions generation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

 /**
   * Generate final image based on analysis, questions, and answers
   */
 static async generateFinalImage(flowId: string, answers: QuestionAnswer[]): Promise<{ 
   success: boolean; 
   finalImagePath?: string; 
   flowId?: string; 
   finalComposedPrompt?: string;
   error?: string 
 }> {
   try {
     // 1. Get the flow data with analysis and questions
     const { data: flowData, error: flowError } = await supabase
       .from('analysis_flows')
       .select('*')
       .eq('id', flowId)
       .single();

     if (flowError || !flowData) {
       return { success: false, error: 'Flow not found' };
     }

     if (!flowData.analysis_result || !flowData.questions) {
       return { success: false, error: 'Missing analysis or questions. Please complete previous steps first.' };
     }

     // 2. Compile questions and answers for context
     const qaContext = await this.compileQandA(flowData.questions, answers);

     // 3. Build comprehensive context for image generation
     const context = `
        Step 1 (analysis output):
        ${flowData.analysis_result}

        Step 2 (clarifications):
        ${qaContext}`;

     // 4. Generate image prompt using OpenAI
     const promptResult = await SimplePromptService.generateImagePrompt(context);
     const promptText = promptResult.dallEPrompt; // This is the image generation prompt

     // 6. Generate the final image using the configured model
     const response = await openai.images.generate({
       model: IMAGE_GENERATION_MODEL,
       prompt: promptText,
       n: 1,
       size: "1024x1024",
       quality: IMAGE_GENERATION_MODEL === "gpt-image-1" ? "high" : "standard",
       ...(IMAGE_GENERATION_MODEL === "dall-e-3" && { response_format: "b64_json" })
     });

     const imageData = response.data?.[0];
     if (!imageData) {
       throw new Error('Image generation failed: No image data returned');
     }

     let buffer: Buffer;

     if (IMAGE_GENERATION_MODEL === "dall-e-3") {
       // DALL-E returns base64 data
       if (!imageData.b64_json) {
         throw new Error('Image generation failed: No base64 data returned');
       }
       buffer = Buffer.from(imageData.b64_json, 'base64');
     } else {
       // gpt-image-1 returns URL, need to download
       if (!imageData.url) {
         throw new Error('Image generation failed: No URL returned');
       }
       const imageResponse = await fetch(imageData.url);
       if (!imageResponse.ok) {
         throw new Error('Failed to download generated image');
       }
       const imageBuffer = await imageResponse.arrayBuffer();
       buffer = Buffer.from(imageBuffer);
     }

     const filename = `generated-${flowId}-${Date.now()}.png`;
     
     const { data: uploadData, error: uploadError } = await supabase.storage
       .from('images')
       .upload(filename, buffer, {
         contentType: 'image/png',
         cacheControl: '3600',
         upsert: false
       });

     if (uploadError) {
       console.error('Supabase storage error:', uploadError);
       return { success: false, error: 'Failed to upload generated image to storage' };
     }

     // 7. Get public URL
     const { data: { publicUrl } } = supabase.storage
       .from('images')
       .getPublicUrl(filename);

     // 8. Update the flow with the final image
     const { error: updateError } = await supabase
       .from('analysis_flows')
       .update({
         final_image_path: publicUrl,
         final_image_prompt: promptText,
         final_composed_prompt: promptResult.finalComposedPrompt,
         updated_at: new Date().toISOString()
       })
       .eq('id', flowId);

     if (updateError) {
       console.error('Failed to update flow with final image:', updateError);
       return { success: false, error: 'Failed to save final image' };
     }

     // 9. Fetch the updated flow data to get the stored prompt
     const { data: updatedFlow } = await supabase
       .from('analysis_flows')
       .select('final_composed_prompt')
       .eq('id', flowId)
       .single();

     return {
       success: true,
       finalImagePath: publicUrl,
       flowId: flowId,
       finalComposedPrompt: updatedFlow?.final_composed_prompt
     };

   } catch (error) {
     console.error('Final image generation error:', error);
     return { 
       success: false, 
       error: error instanceof Error ? error.message : 'Unknown error occurred' 
     };
   }
 }


  /**
   * Build context from previous steps for any step that needs it
   */
  static async buildContext(flowId: string): Promise<{ 
    analysis: string; 
    questions: Question[]; 
    answers: QuestionAnswer[] 
  }> {
    try {
      // Get the flow data with all context
      const { data: flowData, error: flowError } = await supabase
        .from('analysis_flows')
        .select('*')
        .eq('id', flowId)
        .single();

      if (flowError || !flowData) {
        throw new Error('Flow not found');
      }

      // Extract context data
      const analysis = flowData.analysis_result || '';
      const questions = flowData.questions || [];
      const answers = flowData.answers || [];

      return {
        analysis,
        questions,
        answers
      };
    } catch (error) {
      console.error('Error building context:', error);
      throw new Error('Failed to build context from flow');
    }
  }

  /**
   * Compile questions and answers into a clean string for AI
   */
  static async compileQandA(questions: Question[], answers: QuestionAnswer[]): Promise<string> {
    try {
      // Create a map of question IDs to answers for quick lookup
      const answerMap = new Map(answers.map(a => [a.questionId, a.answer]));
      
      // Compile the Q&A into a structured string
      const qaContext = questions.map(question => {
        const answer = answerMap.get(question.id) || 'Not specified';
        return `Q: ${question.text}\nA: ${answer}`;
      }).join('\n\n');
      
      return qaContext;
    } catch (error) {
      console.error('Error compiling Q&A:', error);
      throw new Error('Failed to compile questions and answers');
    }
  }

  /**
   * Get all analysis flows (for admin)
   */
  static async getAllAnalysisFlows(): Promise<any[]> {
    const { data, error } = await supabase
      .from('analysis_flows')
      .select(`
        *,
        images!analysis_flows_original_image_id_fkey(id, file_path, image_type),
        final_images:images!analysis_flows_final_image_id_fkey(id, file_path, image_type)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch analysis flows:', error);
      throw new Error('Failed to fetch analysis flows');
    }

    return data || [];
  }

  /**
   * Get specific analysis flow by ID (for admin)
   */
  static async getAnalysisFlow(flowId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('analysis_flows')
      .select(`
        *,
        images!analysis_flows_original_image_id_fkey(id, file_path, image_type),
        final_images:images!analysis_flows_final_image_id_fkey(id, file_path, image_type)
      `)
      .eq('id', flowId)
      .single();

    if (error) {
      console.error('Failed to fetch analysis flow:', error);
      return null;
    }

    return data;
  }

  /**
   * Update analysis flow (for admin)
   */
  static async updateAnalysisFlow(flowId: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('analysis_flows')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', flowId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update analysis flow:', error);
      throw new Error('Failed to update analysis flow');
    }

    return data;
  }

  /**
   * Deactivate analysis flow (for admin)
   */
  static async deactivateAnalysisFlow(flowId: string): Promise<void> {
    const { error } = await supabase
      .from('analysis_flows')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', flowId);

    if (error) {
      console.error('Failed to deactivate analysis flow:', error);
      throw new Error('Failed to deactivate analysis flow');
    }
  }
}
