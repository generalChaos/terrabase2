-- Simplify prompt schemas to consistent input/output pattern
-- Text prompts: prompt → response
-- Image prompts: prompt → image_url  
-- Image + Text prompts: image + prompt → response

-- Update image_analysis to use image + prompt → response
UPDATE prompt_definitions 
SET 
  input_schema = '{
    "type": "object",
    "properties": {
      "image": {"type": "string"},
      "prompt": {"type": "string"}
    },
    "required": ["image", "prompt"]
  }'::jsonb,
  output_schema = '{
    "type": "object",
    "properties": {
      "response": {"type": "string", "minLength": 10}
    },
    "required": ["response"]
  }'::jsonb,
  return_schema = '{
    "type": "object",
    "properties": {
      "response": {"type": "string"}
    },
    "required": ["response"]
  }'::jsonb,
  prompt_text = 'You are an AI art analyst. Analyze the provided image according to the given prompt and return your analysis as a detailed text response.',
  updated_at = NOW()
WHERE name = 'image_analysis';

-- Update image_prompt_creation to use questions + answers → response
UPDATE prompt_definitions 
SET 
  input_schema = '{
    "type": "object",
    "properties": {
      "questions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": {"type": "string"},
            "text": {"type": "string"},
            "type": {"type": "string"},
            "options": {"type": "array", "items": {"type": "string"}},
            "required": {"type": "boolean"}
          }
        }
      },
      "answers": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["questions", "answers"]
  }'::jsonb,
  output_schema = '{
    "type": "object",
    "properties": {
      "response": {"type": "string", "minLength": 20}
    },
    "required": ["response"]
  }'::jsonb,
  return_schema = '{
    "type": "object",
    "properties": {
      "response": {"type": "string"}
    },
    "required": ["response"]
  }'::jsonb,
  prompt_text = 'Based on the provided questions and answers, create a detailed image generation prompt for DALL-E 3. Return only the prompt text as your response.',
  updated_at = NOW()
WHERE name = 'image_prompt_creation';

-- Update text_processing to use prompt → response
UPDATE prompt_definitions 
SET 
  input_schema = '{
    "type": "object",
    "properties": {
      "prompt": {"type": "string", "minLength": 1}
    },
    "required": ["prompt"]
  }'::jsonb,
  output_schema = '{
    "type": "object",
    "properties": {
      "response": {"type": "string", "minLength": 1}
    },
    "required": ["response"]
  }'::jsonb,
  return_schema = '{
    "type": "object",
    "properties": {
      "response": {"type": "string"}
    },
    "required": ["response"]
  }'::jsonb,
  prompt_text = 'Process the given prompt and return your response as text.',
  updated_at = NOW()
WHERE name = 'text_processing';

-- Update image_text_analysis to use image + prompt → response
UPDATE prompt_definitions 
SET 
  input_schema = '{
    "type": "object",
    "properties": {
      "image": {"type": "string"},
      "prompt": {"type": "string"}
    },
    "required": ["image", "prompt"]
  }'::jsonb,
  output_schema = '{
    "type": "object",
    "properties": {
      "response": {"type": "string", "minLength": 10}
    },
    "required": ["response"]
  }'::jsonb,
  return_schema = '{
    "type": "object",
    "properties": {
      "response": {"type": "string"}
    },
    "required": ["response"]
  }'::jsonb,
  prompt_text = 'Analyze the provided image according to the given text prompt and return your analysis as a detailed text response.',
  updated_at = NOW()
WHERE name = 'image_text_analysis';

-- Add image_generation if it doesn't exist
INSERT INTO prompt_definitions (name, type, input_schema, output_schema, prompt_text, return_schema, model, response_format, active)
VALUES (
  'image_generation',
  'image_generation',
  '{
    "type": "object",
    "properties": {
      "prompt": {"type": "string", "minLength": 10}
    },
    "required": ["prompt"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "image_url": {"type": "string"}
    },
    "required": ["image_url"]
  }'::jsonb,
  'Generate an image based on the provided prompt using DALL-E 3. Return the image URL as your response.',
  '{
    "type": "object",
    "properties": {
      "image_url": {"type": "string"}
    },
    "required": ["image_url"]
  }'::jsonb,
  'gpt-4o',
  'json_object',
  true
) ON CONFLICT (name) DO UPDATE SET
  input_schema = EXCLUDED.input_schema,
  output_schema = EXCLUDED.output_schema,
  prompt_text = EXCLUDED.prompt_text,
  return_schema = EXCLUDED.return_schema,
  updated_at = NOW();
