-- Fix image analysis prompt to use the simple schema (just response field)
UPDATE prompt_definitions 
SET 
  output_schema = '{"type": "object", "required": ["response"], "properties": {"response": {"type": "string", "minLength": 10}}}',
  prompt_text = 'Analyze this image and describe what you see in 2-3 sentences.'
WHERE name = 'image_analysis' AND type = 'image_analysis';
