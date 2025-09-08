# Prompts V1 - Structured Approach

This document contains the V1 prompt definitions that used a structured, clinical approach to character drawing analysis. These are preserved for reference and potential rollback purposes.

## Prompt Definitions (V1 - Structured Approach)

### `image_analysis`

**Model:** `gpt-4o`  
**Input Schema:** `{"type": "object", "required": ["image", "prompt"], "properties": {"image": {"type": "string"}, "prompt": {"type": "string"}}}`  
**Output Schema:** `{"type": "object", "required": ["analysis"], "properties": {"analysis": {"type": "string", "minLength": 10}}}`

**Prompt Text:**
```
You are an assistant that helps a child explain their drawing so it can be recreated as a professional-quality line drawing. Always follow these steps in order: Shape Inventory List all visible parts of the drawing as simple shapes (ovals, blobs, lines, circles). Include head, limbs, eyes, mouth, base, connectors, and decorations. Interpretation Options For each part, suggest 2–3 possible interpretations. Keep them playful, age-appropriate, and neutral. Organize by function (face feature, body part, accessory, decoration). Ambiguity Scan Assign confidence (High / Medium / Low). Mark all Low confidence parts for clarification.
```

**Characteristics:**
- Structured, clinical approach
- Focus on shape inventory and interpretation
- Confidence-based ambiguity scanning
- Less conversational tone

### `questions_generation`

**Model:** `gpt-5`  
**Input Schema:** `{"type": "object", "required": ["analysis", "prompt"], "properties": {"analysis": {"type": "string"}, "prompt": {"type": "string"}}}`  
**Output Schema:** `{"type": "object", "required": ["questions"], "properties": {"questions": {"type": "array", "items": {"type": "object", "required": ["id", "text", "type", "options", "required"], "properties": {"id": {"type": "string"}, "text": {"type": "string", "minLength": 10}, "type": {"enum": ["multiple_choice"], "type": "string"}, "options": {"type": "array", "items": {"type": "string"}, "maxItems": 6, "minItems": 2}, "required": {"type": "boolean"}}}, "maxItems": 15, "minItems": 3}}}`

**Prompt Text:**
```
Ask the Child For each ambiguous part: Ask 4 short, kid-friendly questions (no more than 12 words). Provide 2–3 answer choices with clear, simple labels. Example: "Is this part eyes, teeth, or decoration?" Wait for the answer before continuing. Refinement Update each clarified part with specific details about shape, placement, and proportion. Do not use animation or motion words.

keep it fun and adventurous. Incorporate them in questions about the place and characters abilities. Facilitate creativity.

Return a JSON object with a "questions" array containing the generated questions. Each question should have id, text, type, options, and required fields.
```

**Characteristics:**
- Focus on ambiguous parts only
- Short, kid-friendly questions
- Refinement-based approach
- Less emphasis on character personality

### `image_generation`

**Model:** `dall-e-3`  
**Input Schema:** `{"type": "object", "required": ["prompt", "flow_summary"], "properties": {"prompt": {"type": "string", "minLength": 10}, "flow_summary": {"type": "object"}}}`  
**Output Schema:** `{"type": "object", "required": ["image_base64"], "properties": {"image_base64": {"type": "string"}}}`

**Prompt Text:**
```
Final Line Drawing Spec Produce one complete, unambiguous description for an illustrator. Include: Head/face features (eyes, mouth, nose, teeth, horns, etc.) Limbs/appendages (arms, legs, wings, stalks, etc.) Base/connector/outline shape Accessories/decorations (patterns, clothing-like details) Notes on relative size, symmetry, and style consistency create a prompt for a polished line drawing description that stays true to the child's intent which incorporates all of the answers and clarifications and analysis gathered.

From that prompt, generate an image which stays true to the child's drawing but incorporates all of the ideas into one coherent professional illustration. Keep it fun, kid friendly and playful.
```

**Characteristics:**
- Technical, illustrator-focused approach
- Detailed specification requirements
- Less emphasis on character personality and creativity
- More clinical description style

## Key Differences from V2 Disambiguation Strategy

### V1 Approach Issues:
1. **Too Clinical**: Structured, formal language that didn't engage children
2. **Shape-Focused**: Overly technical approach to drawing analysis
3. **Less Conversational**: Missing the enthusiastic, understanding tone
4. **Ambiguity-Centric**: Focused on problems rather than creative opportunities
5. **Technical Specifications**: Image generation focused on technical details rather than character personality

### V2 Approach Benefits:
1. **Child-Centric**: Makes children feel like creative directors
2. **Conversational**: Enthusiastic, understanding tone throughout
3. **Character-Focused**: Emphasizes personality and creative vision
4. **Opportunity-Focused**: Frames ambiguities as creative opportunities
5. **Personality-Driven**: Image generation focuses on character essence

## Migration Notes

These V1 prompts were replaced in the clean database migration (`20250906060000_clean_database_setup.sql`) with V2 prompts that implement the disambiguation strategy. The new prompts are designed to:

- Show enthusiasm and understanding of the child's creative vision
- Generate conversational analysis that feels engaging
- Create simple, fun questions that feel like a creative game
- Focus on character personality and creative choices
- Make children feel ownership and pride in their final result

## Rollback Information

If needed, these old prompts can be restored by updating the `prompt_text` field in the `prompt_definitions` table. However, this would require reverting to the previous approach and losing the benefits of the disambiguation strategy.
