# Prompt Creation Guide

## Overview

The Magic Marker prompt system uses a structured approach with predefined input/output schemas and placeholder variables, specifically designed for character drawing disambiguation and professional illustration generation. This guide explains how to create and manage prompts effectively within our disambiguation strategy.

## Disambiguation Strategy Integration

Magic Marker prompts are designed around a specific disambiguation strategy for character drawings:

### **Core Philosophy**
- **Child as Creative Director**: Children make important decisions about their character
- **Preserve Original Vision**: Final image feels like "their character, but better"
- **Transform Ambiguities into Strengths**: Unclear elements become creative opportunities

### **Prompt Design Principles**
- **Conversational Tone**: Use enthusiastic, encouraging language
- **Visual Disambiguation First**: Focus on shapes, colors, features
- **Character Concepts Second**: Personality, mood, abilities
- **Simple, Fun Questions**: Frame as creative game, not test
- **Show Understanding**: Demonstrate you "get" their creative vision

For detailed strategy documentation, see [Disambiguation Strategy Guide](DISAMBIGUATION_STRATEGY.md).

## Key Concepts

### 1. Prompt Types
Each prompt has a specific `type` that defines its purpose and expected input/output format:

- **`image_analysis`** - Analyze character drawings with conversational, enthusiastic tone
- **`questions_generation`** - Generate simple, fun disambiguation questions
- **`image_generation`** - Create professional character illustrations
- **`conversational_question`** - Generate follow-up questions in conversation flow
- **`image_prompt_creation`** - Create image generation prompts from Q&A
- **`text_processing`** - Process text with various transformations
- **`image_text_analysis`** - Analyze images with text prompts

### 2. Schema System
Each prompt has three schemas:

- **`input_schema`** - Defines what data the prompt expects
- **`output_schema`** - Defines what the AI should return (for validation)
- **`return_schema`** - Simplified schema for actual return (used by PromptExecutor)

### 3. Placeholder System
Prompts use placeholders that get replaced at runtime:

- `{image}` - Base64 encoded image
- `{text}` - Text input
- `{context}` - Additional context
- `{instructions}` - Specific instructions
- `{analysis}` - Analysis result
- `{previousAnswers}` - Previous answers
- `{conversationContext}` - Conversation context

## Creating a New Prompt

### Step 1: Define the Prompt Type
First, add your new prompt type to `promptTypes.ts`:

```typescript
// Add to PromptType enum
export type PromptType = 
  | 'image_analysis'
  | 'questions_generation'
  | 'conversational_question'
  | 'image_prompt_creation'
  | 'text_processing'
  | 'image_text_analysis'
  | 'your_new_type'  // Add here

// Add to PromptTypeMap
export const PROMPT_TYPE_MAP: Record<PromptType, PromptTypeConfig> = {
  // ... existing types
  your_new_type: {
    input: {
      required_field: string,
      optional_field?: string
    },
    output: {
      result: string,
      response?: string
    }
  }
}

// Add to OUTPUT_SCHEMAS
export const OUTPUT_SCHEMAS: Record<PromptType, JSONSchema> = {
  // ... existing schemas
  your_new_type: {
    type: 'object',
    properties: {
      result: { type: 'string', minLength: 10 },
      response: { type: 'string' }
    },
    required: ['result']
  }
}
```

### Step 2: Create Database Migration
Create a migration to add your prompt to the database:

```sql
-- Create migration file: supabase/migrations/YYYYMMDD_add_your_prompt.sql
INSERT INTO prompt_definitions (
  name,
  type,
  prompt_text,
  input_schema,
  output_schema,
  return_schema,
  active
) VALUES (
  'your_prompt_name',
  'your_new_type',
  'Your prompt text with {placeholders}',
  '{"type": "object", "properties": {...}}'::jsonb,
  '{"type": "object", "properties": {...}}'::jsonb,
  '{"type": "object", "properties": {...}}'::jsonb,
  true
);
```

### Step 3: Add to PromptExecutor
Update `PromptExecutor.buildMessageContent()` to handle your new type:

```typescript
case 'your_new_type':
  return [
    {
      type: 'text',
      text: `Your prompt text with ${input.required_field} and ${input.optional_field}`
    }
  ];
```

### Step 4: Add to OpenAIService
Add a method to `openaiNew.ts` for your prompt type:

```typescript
async yourNewMethod(input: YourInputType): Promise<YourOutputType> {
  const result = await this.promptExecutor.execute('your_new_type', input);
  return result as YourOutputType;
}
```

## Best Practices

### 1. Prompt Text Guidelines
- **Keep it simple**: Don't include schemas in prompt text
- **Use placeholders**: Leverage the placeholder system for dynamic content
- **Be specific**: Give clear instructions for the AI
- **Test thoroughly**: Validate with various inputs

### 2. Schema Design
- **Input Schema**: Define all possible input fields (required and optional)
- **Output Schema**: Be comprehensive for validation
- **Return Schema**: Keep it simple for actual usage
- **Consistency**: Use consistent field names across similar prompts

### 3. Placeholder Usage
- **Required fields**: Always include in prompt text
- **Optional fields**: Use conditional logic in prompt text
- **Context**: Provide relevant context for better AI responses
- **Instructions**: Be specific about what you want the AI to do

## Example: Creating a Color Analysis Prompt

### 1. Define Type
```typescript
color_analysis: {
  input: {
    image: string,
    focus_colors?: string[],
    analysis_depth?: 'basic' | 'detailed' | 'expert'
  },
  output: {
    dominant_colors: string[],
    color_harmony: string,
    mood: string,
    response?: string
  }
}
```

### 2. Create Migration
```sql
INSERT INTO prompt_definitions (
  name, type, prompt_text, input_schema, output_schema, return_schema, active
) VALUES (
  'color_analysis',
  'color_analysis',
  'Analyze the colors in this image. Focus on {focus_colors} and provide {analysis_depth} analysis of the color palette, harmony, and mood.',
  '{"type": "object", "properties": {"image": {"type": "string"}, "focus_colors": {"type": "array", "items": {"type": "string"}}, "analysis_depth": {"type": "string", "enum": ["basic", "detailed", "expert"]}}, "required": ["image"]}'::jsonb,
  '{"type": "object", "properties": {"dominant_colors": {"type": "array", "items": {"type": "string"}}, "color_harmony": {"type": "string"}, "mood": {"type": "string"}, "response": {"type": "string"}}, "required": ["dominant_colors", "color_harmony", "mood"]}'::jsonb,
  '{"type": "object", "properties": {"dominant_colors": {"type": "array"}, "color_harmony": {"type": "string"}, "mood": {"type": "string"}}, "required": ["dominant_colors", "color_harmony", "mood"]}'::jsonb,
  true
);
```

### 3. Update PromptExecutor
```typescript
case 'color_analysis':
  const focusColors = input.focus_colors?.join(', ') || 'all colors';
  const depth = input.analysis_depth || 'detailed';
  return [
    {
      type: 'text',
      text: `Analyze the colors in this image. Focus on ${focusColors} and provide ${depth} analysis of the color palette, harmony, and mood.`
    },
    {
      type: 'image_url',
      image_url: { url: input.image }
    }
  ];
```

## Testing Your Prompt

### 1. Use Test Endpoints
- `/api/test-all-prompts` - Test all prompts
- `/api/test-simple` - Test text processing
- `/api/test-image-text` - Test image + text analysis

### 2. Interactive Prompt Tester
- Visit `/admin/prompt-tester` - Interactive testing interface
- **Select your prompt** from the dropdown (only active prompts shown)
- **Upload images** directly for image-based prompts
- **Test with real inputs** and see live validation
- **View generated images** for image generation prompts
- **Test conversational flows** with the specialized Q&A interface

### 3. Conversational Q&A Testing
For conversational prompts, use the specialized testing interface:

1. **Select "conversational_question"** from the prompt list
2. **Click "Run Test"** to start the conversation
3. **Answer questions** by clicking on the provided options
4. **Click "Next Question"** to generate follow-up questions
5. **Watch the conversation evolve** as the AI learns about preferences
6. **View the summary** when the conversation completes

**Features:**
- **Step-by-step Instructions**: Clear guidance on how to test conversation flows
- **Visual Progress Tracking**: Progress bar and question status indicators
- **Answer Selection**: Interactive multiple-choice question answering
- **Conversation Summary**: AI-generated summary when conversation completes
- **Statistics Dashboard**: Track questions asked, answered, and completion status
- **Reset Functionality**: Start new conversations for repeated testing

### 4. Check Admin Interface
- Visit `/admin/prompt-definitions` - Manage prompt definitions
- Visit `/admin/conversations` - View conversation details with complete prompt/response data
- Verify schemas are displayed correctly
- Test editing prompt text
- Validate placeholder usage

### 5. Monitor Performance
- Check response times
- Verify output validation
- Monitor error rates
- Test with various inputs

### 6. Debug with Conversation Details
- View complete prompt/response data for each conversation
- Inspect processing steps with input/output details
- Identify validation failures and schema mismatches
- Monitor AI response quality and consistency

## Troubleshooting

### Common Issues

1. **Schema Mismatch**: Ensure input/output schemas match your prompt type definition
2. **Placeholder Errors**: Verify placeholders are correctly formatted and available in input
3. **Validation Failures**: Check that return_schema matches what the AI actually returns
4. **Type Errors**: Ensure TypeScript types match your schema definitions
5. **Misleading Error Messages**: Error handling now provides specific, actionable error messages instead of generic ones

### Debug Tools

- Use `/api/debug-prompt?name=your_prompt` to inspect prompt definitions
- Check browser console for validation errors
- Use test endpoints to verify functionality
- Monitor database logs for constraint violations
- Use conversation details in admin panel to inspect complete prompt/response data
- Check processing steps for detailed error information and response times

## Migration from Legacy System

If migrating from the old prompt system:

1. **Map old prompts** to new types
2. **Extract schemas** from old prompt content
3. **Create migrations** for new prompt definitions
4. **Update API calls** to use new OpenAIService methods
5. **Test thoroughly** before removing old system
6. **Clean up** old prompt tables and services

## Advanced Features

### 1. Conditional Logic
Use placeholders to create dynamic prompts:

```
If {analysis_depth} is 'expert', provide detailed technical analysis.
If {analysis_depth} is 'basic', provide simple overview.
```

### 2. Context Awareness
Leverage conversation context for better responses:

```
Based on the previous answers: {previousAnswers}
And the conversation context: {conversationContext}
Generate the next question.
```

### 3. Multi-Modal Inputs
Combine different input types:

```
Analyze this image: {image}
With this text prompt: {text}
Considering this context: {context}
```

This guide should help you create effective prompts that work seamlessly with the Magic Marker system!
