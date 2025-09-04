-- Fix image_prompt_creation prompt directly
UPDATE prompt_definitions 
SET 
  prompt_text = 'Based on these questions and answers, create a detailed image generation prompt for DALL-E 3.',
  return_schema = '{"type": "object", "properties": {"prompt": {"type": "string", "minLength": 20}, "response": {"type": "string"}}, "required": ["prompt"]}',
  response_format = 'json_object'
WHERE name = 'image_prompt_creation';

-- Fix image_text_analysis prompt directly  
UPDATE prompt_definitions 
SET 
  prompt_text = 'You are an expert image analyst. Analyze the provided image based on the given text prompt and context.

Image: {image}
Text Prompt: {text}
Context: {context}
Instructions: {instructions}

Provide a detailed analysis that addresses the text prompt while considering the visual elements in the image. Focus on:
- Visual composition and elements
- Artistic interpretation
- Technical aspects if relevant
- Any specific requirements from the text prompt

Be thorough, insightful, and provide actionable insights.',
  return_schema = '{"type": "object", "properties": {"analysis": {"type": "string", "minLength": 10}, "response": {"type": "string"}}, "required": ["analysis"]}',
  response_format = 'json_object'
WHERE name = 'image_text_analysis';
