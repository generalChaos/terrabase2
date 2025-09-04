-- Add image_text_analysis prompt definition
INSERT INTO prompt_definitions (
  name,
  type,
  input_schema,
  output_schema,
  prompt_text,
  return_schema,
  model,
  response_format,
  max_tokens,
  temperature,
  active
) VALUES (
  'image_text_analysis',
  'image_text_analysis',
  $${
    "type": "object",
    "properties": {
      "image": { "type": "string", "description": "Base64 encoded image" },
      "text": { "type": "string", "description": "Text prompt or instruction" },
      "context": { "type": "string", "description": "Additional context" },
      "instructions": { "type": "string", "description": "Specific processing instructions" }
    },
    "required": ["image", "text"]
  }$$,
  $${
    "type": "object",
    "properties": {
      "analysis": { "type": "string", "minLength": 10, "description": "Analysis result" },
      "response": { "type": "string", "description": "Optional additional response" }
    },
    "required": ["analysis"]
  }$$,
  $$You are an expert image analyst. Analyze the provided image based on the given text prompt and context.

Image: {image}
Text Prompt: {text}
Context: {context}
Instructions: {instructions}

Provide a detailed analysis that addresses the text prompt while considering the visual elements in the image. Focus on:
- Visual composition and elements
- Artistic interpretation
- Technical aspects if relevant
- Any specific requirements from the text prompt

Be thorough, insightful, and provide actionable insights.$$,
  $${
    "type": "object",
    "properties": {
      "analysis": { "type": "string", "minLength": 10 },
      "response": { "type": "string" }
    },
    "required": ["analysis"]
  }$$,
  'gpt-4o',
  'json_object',
  2000,
  0.7,
  true
);
