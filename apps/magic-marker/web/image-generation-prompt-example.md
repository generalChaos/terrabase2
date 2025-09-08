# Image Generation Prompt Example

This document shows the complete prompt and context used in the first part of image generation (GPT-4o creating the DALL-E prompt).

## Overview

The image generation process is a **two-step process**:

1. **Step 1**: GPT-4o receives a comprehensive prompt + context and generates a detailed DALL-E prompt
2. **Step 2**: DALL-E uses that prompt to generate the actual image

## Complete Prompt Sent to GPT-4o

**Total Length**: 4,403 characters

### 1. Base Database Prompt

```
Create a detailed, professional illustration prompt for DALL-E that recreates the child's original drawing with enhanced details.

IMPORTANT: The generated image should include all the same elements from the original drawing. Focus on enhancing and clarifying what the child already drew rather than adding new elements.

Use the Image Analysis and Previous Step Results provided in the context below to understand the child's original character and their answers to questions.

Your task:
1. Read the Image Analysis to identify all elements from the original drawing (shapes, features, parts, etc.)
2. Review the Questions and Answers to understand how the child clarified ambiguous elements
3. Create a DALL-E prompt that includes all original elements, enhanced with the child's clarifications
4. For each original element, describe it professionally while maintaining its original purpose and placement
5. Use the child's answers to add specific details, colors, and style to the existing elements
6. Focus on the elements that were in the original drawing rather than adding new ones
7. Make it kid-friendly, playful, and true to the child's original intent and their answers

IMPORTANT: You must return ONLY the DALL-E prompt text as a plain string. Do not wrap it in JSON, do not add quotes, do not add any formatting. Just return the raw prompt text that DALL-E can use directly.
```

### 2. Context Added by addContextToPrompt()

```
Image Analysis:
[The analysis of the original drawing - what the AI detected in the child's drawing]

Previous Step Results:
Questions Generation:
- Generated Questions: [JSON array of questions that were asked]

Conversational Questions:
- Conversation Questions: [JSON array of conversational questions]

User Preferences:
- Style: [user's style preferences]
- Colors: [user's color preferences] 
- Mood: [user's mood preferences]
- Composition: [user's composition preferences]

Final Artistic Direction: Based on the comprehensive analysis of the child's original drawing and their detailed responses:

ORIGINAL DRAWING ANALYSIS: [The AI's analysis of what was detected in the drawing]

CHILD'S CLARIFICATIONS:
- I love the head! What did you want it to express?: Happiness
- What fantastic powers does this character have?: Fire-breathing
- What are those cool vertical lines above the arms?: Magic sparks
- What do you think would look best for the torso?: Armor plates
- What did you want the arm faces to say?: Beware!
- What adventure is your character on?: Treasure hunting
- I love how the legs look! What should they do?: Sprint fast
- What special environment suits your character best?: Mysterious forest

ARTISTIC VISION: Create a detailed illustration that enhances the child's original drawing with these specific clarifications, maintaining the playful, imaginative nature while incorporating all the child's detailed preferences. Focus on preserving their original elements while adding the professional details they've specified.
```

### 3. Complete Flow Summary Context (JSON)

```json
{
  "analysis": "[image analysis text]",
  "questions": [
    {
      "id": "question-1",
      "text": "I love the head! What did you want it to express?",
      "options": ["Happiness", "Sadness", "Anger", "Surprise"]
    },
    {
      "id": "question-2", 
      "text": "What fantastic powers does this character have?",
      "options": ["Fire-breathing", "Flying", "Invisibility", "Super strength"]
    },
    {
      "id": "question-3",
      "text": "What are those cool vertical lines above the arms?",
      "options": ["Magic sparks", "Antennas", "Wings", "Lasers"]
    },
    {
      "id": "question-4",
      "text": "What do you think would look best for the torso?",
      "options": ["Armor plates", "Soft fur", "Shiny metal", "Colorful scales"]
    },
    {
      "id": "question-5",
      "text": "What did you want the arm faces to say?",
      "options": ["Beware!", "Hello!", "Help!", "Welcome!"]
    },
    {
      "id": "question-6",
      "text": "What adventure is your character on?",
      "options": ["Treasure hunting", "Space mission", "Rescue mission", "Exploration"]
    },
    {
      "id": "question-7",
      "text": "I love how the legs look! What should they do?",
      "options": ["Sprint fast", "Jump high", "Dance", "Climb"]
    },
    {
      "id": "question-8",
      "text": "What special environment suits your character best?",
      "options": ["Mysterious forest", "Space station", "Underwater city", "Mountain peak"]
    }
  ],
  "answers": [
    "Happiness", "Fire-breathing", "Magic sparks", "Armor plates", 
    "Beware!", "Treasure hunting", "Sprint fast", "Mysterious forest"
  ],
  "artisticDirection": "Based on the comprehensive analysis of the child's original drawing and their detailed responses:\n\nORIGINAL DRAWING ANALYSIS: [The AI's analysis of what was detected in the drawing]\n\nCHILD'S CLARIFICATIONS:\n- I love the head! What did you want it to express?: Happiness\n- What fantastic powers does this character have?: Fire-breathing\n- What are those cool vertical lines above the arms?: Magic sparks\n- What do you think would look best for the torso?: Armor plates\n- What did you want the arm faces to say?: Beware!\n- What adventure is your character on?: Treasure hunting\n- I love how the legs look! What should they do?: Sprint fast\n- What special environment suits your character best?: Mysterious forest\n\nARTISTIC VISION: Create a detailed illustration that enhances the child's original drawing with these specific clarifications, maintaining the playful, imaginative nature while incorporating all the child's detailed preferences. Focus on preserving their original elements while adding the professional details they've specified.",
  "stepResults": {
    "questions_generation": {
      "input": { "response": "[image analysis]" },
      "output": { "questions": "[array of questions]" },
      "timestamp": "2024-01-01T00:00:00Z",
      "success": true
    },
    "conversational_question": {
      "input": { "response": "[image analysis]", "previousAnswers": [] },
      "output": { "questions": "[array of conversational questions]" },
      "timestamp": "2024-01-01T00:00:00Z", 
      "success": true
    }
  },
  "conversationHistory": []
}
```

## GPT-4o Response (Generated DALL-E Prompt)

```
Create an illustration of a fantasy creature, a blend of robotic and monster-like design, reflecting a child's imagination. The creature has a rectangular head with eyes and a jagged mouth expressing happiness. Its torso is round, encased in armor plates with extensions resembling limbs. The arms are block-like with faces, each with sharp-toothed mouths, conveying a "Beware!" expression. Above the arms, there are vertical lines depicted as magic sparks. The legs are angular, designed for sprinting fast, similar to mechanical or spider-like support. The entire character is set in a mysterious forest, suggesting a treasure hunting adventure. The creature's powers include fire-breathing, adding an element of playful menace. The style should be artistic, colorful, and kid-friendly, staying true to the imaginative and complex nature of the child's original intent.
```

## DALL-E Image Generation

The generated DALL-E prompt is then sent to DALL-E 3 to create the final image:

- **Model**: DALL-E 3
- **Image Size**: 1024x1024 (default)
- **Quality**: High
- **Style**: Natural
- **Response Format**: Base64 encoded image data

## Key Features of This System

### 1. **Comprehensive Context**
- Image analysis of the original drawing
- All questions asked to the child
- All answers provided by the child
- Artistic direction combining questions and answers
- User preferences and step results

### 2. **Structured Approach**
- Clear instructions on what to focus on
- Emphasis on enhancing rather than replacing original elements
- Kid-friendly and playful tone requirements
- Professional DALL-E prompt formatting

### 3. **Two-Step Process**
- **Step 1**: GPT-4o creates detailed DALL-E prompt using all context
- **Step 2**: DALL-E generates the actual image from the prompt

### 4. **Quality Assurance**
- Schema validation (skipped for image generation with text format)
- Comprehensive logging and monitoring
- Error handling and fallbacks

## Technical Implementation

### Files Involved:
- `apps/magic-marker/web/src/lib/promptExecutor.ts` - Main prompt execution logic
- `apps/magic-marker/web/src/lib/contextManager.ts` - Context building and management
- `apps/magic-marker/web/src/app/api/images/generate/route.ts` - Image generation API endpoint
- `apps/magic-marker/web/supabase/migrations/20250906060000_clean_database_setup.sql` - Database prompt definitions

### Key Methods:
- `PromptExecutor.execute()` - Main execution method
- `buildContextAwarePrompt()` - Builds the comprehensive prompt
- `addContextToPrompt()` - Adds step-specific context
- `ContextManager.getRelevantContextForStep()` - Extracts relevant context

This system ensures that the final generated image is highly personalized to the child's original drawing and their specific preferences, creating a unique and meaningful result.
