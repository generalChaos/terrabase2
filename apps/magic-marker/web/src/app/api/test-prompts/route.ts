import { NextRequest, NextResponse } from 'next/server';
import { PromptService } from '@/lib/promptService';

export async function GET(request: NextRequest) {
  try {
    console.log('Test prompts endpoint called');
    
    // Test fetching all prompts
    const allPrompts = await PromptService.getAllActivePrompts();
    console.log('All active prompts:', allPrompts.length);
    
    // Test fetching specific prompts
    const imageAnalysisPrompt = await PromptService.getPrompt('image_analysis');
    const systemPrompt = await PromptService.getPrompt('image_prompt_creation_system');
    const userPrompt = await PromptService.getPrompt('image_prompt_creation_user');
    
    // Test template variable replacement
    const testTemplate = "Hello {name}, you have {count} messages.";
    const replaced = PromptService.replaceTemplateVariables(testTemplate, {
      name: "John",
      count: 5
    });
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        total_prompts: allPrompts.length,
        prompts: allPrompts.map(p => ({
          id: p.id,
          name: p.name,
          content_length: p.content.length,
          active: p.active,
          created_at: p.created_at
        })),
        specific_prompts: {
          image_analysis: imageAnalysisPrompt ? {
            id: imageAnalysisPrompt.id,
            content_length: imageAnalysisPrompt.content.length,
            found: true
          } : { found: false },
          system_prompt: systemPrompt ? {
            id: systemPrompt.id,
            content_length: systemPrompt.content.length,
            found: true
          } : { found: false },
          user_prompt: userPrompt ? {
            id: userPrompt.id,
            content_length: userPrompt.content.length,
            found: true
          } : { found: false }
        },
        template_test: {
          original: testTemplate,
          replaced: replaced,
          success: replaced.includes("John") && replaced.includes("5")
        }
      }
    });

  } catch (error: any) {
    console.error('Test prompts error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
