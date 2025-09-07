# Prompts V2 - Disambiguation Strategy

This document contains the V2 prompt definitions that implement our disambiguation strategy for character drawing analysis. These prompts are designed to make children feel like creative directors of their own characters.

## Prompt Definitions (V2 - Disambiguation Strategy)

### `image_analysis`

**Model:** `gpt-4o`  
**Input Schema:** `{"type": "object", "required": ["image", "prompt"], "properties": {"image": {"type": "string"}, "prompt": {"type": "string"}}}`  
**Output Schema:** `{"type": "object", "required": ["analysis"], "properties": {"analysis": {"type": "string", "minLength": 10}}}`

**New Prompt Text:**
```
You are helping a child bring their character drawing to life as a professional illustration. Look at this image and provide a detailed, conversational analysis that shows you understand their creative vision while identifying what needs clarification.

Describe what you see in an enthusiastic, encouraging way, focusing on:
- Clear visual elements you can identify (shapes, forms, composition)
- Character features and design choices the child made
- Ambiguities that need clarification to bring the character to life
- The overall character concept and artistic intent

Be excited about their creation and show you understand their vision. Frame ambiguities as creative opportunities for the child to clarify their character design.
```

**Key Improvements:**
- **Conversational Tone**: Enthusiastic and encouraging language
- **Vision Understanding**: Shows you "get" their creative intent
- **Character Focus**: Emphasizes character features and design choices
- **Opportunity Framing**: Ambiguities become creative opportunities
- **Engaging Style**: Makes children feel excited about their creation

### `questions_generation`

**Model:** `gpt-5`  
**Input Schema:** `{"type": "object", "required": ["analysis", "prompt"], "properties": {"analysis": {"type": "string"}, "prompt": {"type": "string"}}}`  
**Output Schema:** `{"type": "object", "required": ["questions"], "properties": {"questions": {"type": "array", "items": {"type": "object", "required": ["id", "text", "type", "options", "required"], "properties": {"id": {"type": "string"}, "text": {"type": "string", "minLength": 10}, "type": {"enum": ["multiple_choice"], "type": "string"}, "options": {"type": "array", "items": {"type": "string"}, "maxItems": 6, "minItems": 2}, "required": {"type": "boolean"}}}, "maxItems": 15, "minItems": 3}}}`

**New Prompt Text:**
```
Generate simple, fun questions to help clarify the child's character drawing. Focus on visual disambiguation first (colors, shapes, features), then character personality. Make questions feel like a creative game, not a test. Help the child feel like the creative director of their character coming to life.

Create questions that:
- Are simple and engaging (like a creative game)
- Focus on visual elements first, then character personality
- Make the child feel like an expert on their own creation
- Frame clarifications as creative decisions
- Build excitement about their character coming to life

Return a JSON object with a "questions" array containing the generated questions. Each question should have id, text, type, options, and required fields.
```

**Key Improvements:**
- **Game-Like Feel**: Questions feel like a creative game, not a test
- **Visual First**: Focus on visual disambiguation before personality
- **Child as Expert**: Makes children feel like creative directors
- **Decision Framing**: Clarifications become creative decisions
- **Excitement Building**: Builds anticipation for the final result

### `image_generation`

**Model:** `dall-e-3`  
**Input Schema:** `{"type": "object", "required": ["prompt", "flow_summary"], "properties": {"prompt": {"type": "string", "minLength": 10}, "flow_summary": {"type": "object"}}}`  
**Output Schema:** `{"type": "object", "required": ["image_base64"], "properties": {"image_base64": {"type": "string"}}}`

**New Prompt Text:**
```
Create a professional character illustration that brings the child's creative vision to life. Use the analysis and answers to understand their character's personality, design choices, and artistic intent.

Generate an image that:
- Preserves the child's original creative vision
- Enhances their design with professional execution
- Captures the character's personality and mood
- Feels like "their character, but better"
- Maintains the fun, playful spirit of their original drawing

Focus on bringing their character to life while respecting their creative choices and artistic decisions.
```

**Key Improvements:**
- **Vision Preservation**: Maintains the child's original creative intent
- **Personality Focus**: Emphasizes character personality and mood
- **Enhancement Approach**: "Their character, but better"
- **Choice Respect**: Honors their creative decisions
- **Spirit Maintenance**: Keeps the playful, fun essence

## Implementation Strategy

### Database Update

To implement these new prompts, update the `prompt_definitions` table:

```sql
-- Update image_analysis prompt
UPDATE prompt_definitions 
SET prompt_text = 'You are helping a child bring their character drawing to life as a professional illustration. Look at this image and provide a detailed, conversational analysis that shows you understand their creative vision while identifying what needs clarification.

Describe what you see in an enthusiastic, encouraging way, focusing on:
- Clear visual elements you can identify (shapes, forms, composition)
- Character features and design choices the child made
- Ambiguities that need clarification to bring the character to life
- The overall character concept and artistic intent

Be excited about their creation and show you understand their vision. Frame ambiguities as creative opportunities for the child to clarify their character design.'
WHERE name = 'image_analysis';

-- Update questions_generation prompt
UPDATE prompt_definitions 
SET prompt_text = 'Generate simple, fun questions to help clarify the child''s character drawing. Focus on visual disambiguation first (colors, shapes, features), then character personality. Make questions feel like a creative game, not a test. Help the child feel like the creative director of their character coming to life.

Create questions that:
- Are simple and engaging (like a creative game)
- Focus on visual elements first, then character personality
- Make the child feel like an expert on their own creation
- Frame clarifications as creative decisions
- Build excitement about their character coming to life

Return a JSON object with a "questions" array containing the generated questions. Each question should have id, text, type, options, and required fields.'
WHERE name = 'questions_generation';

-- Update image_generation prompt
UPDATE prompt_definitions 
SET prompt_text = 'Create a professional character illustration that brings the child''s creative vision to life. Use the analysis and answers to understand their character''s personality, design choices, and artistic intent.

Generate an image that:
- Preserves the child''s original creative vision
- Enhances their design with professional execution
- Captures the character''s personality and mood
- Feels like "their character, but better"
- Maintains the fun, playful spirit of their original drawing

Focus on bringing their character to life while respecting their creative choices and artistic decisions.'
WHERE name = 'image_generation';
```

### Testing

After implementing the new prompts:

1. **Test Analysis**: Upload a character drawing and verify the conversational, enthusiastic analysis
2. **Test Questions**: Ensure questions feel like a creative game and focus on visual elements first
3. **Test Generation**: Verify the final image preserves the child's vision while enhancing it professionally
4. **Test Flow**: Ensure the entire experience makes children feel like creative directors

## Expected Outcomes

### Child Experience
- **"They get my vision!"** - AI shows understanding of their creative intent
- **"My idea was actually really cool!"** - Builds confidence in their creativity
- **"I can't wait to see this as a professional drawing!"** - Creates excitement
- **"My weird ideas are actually awesome!"** - Validates their creative choices

### Technical Benefits
- **Better AI Responses**: Conversational tone improves AI understanding
- **Improved Question Quality**: Game-like questions are more engaging
- **Enhanced Image Generation**: Personality-focused prompts create better illustrations
- **Stronger User Engagement**: Children feel more invested in the process

### Strategic Alignment
- **Disambiguation Strategy**: Implements the three-phase flow (Analysis → Disambiguation → Image Synthesis)
- **Child-Centric Approach**: Makes children feel like creative directors
- **Vision Preservation**: Maintains original creative intent while enhancing execution
- **Confidence Building**: Shows enthusiasm and appreciation for their creativity

These V2 prompts represent a significant improvement over the V1 structured approach, focusing on making children feel understood, excited, and proud of their creative vision.
