-- Fix questions_generation return_schema to match hardcoded OUTPUT_SCHEMAS
-- Remove the extra "response" field that's causing validation failures

UPDATE prompt_definitions 
SET return_schema = $${"type": "object", "properties": {"questions": {"type": "array", "items": {"type": "object", "properties": {"id": {"type": "string"}, "text": {"type": "string", "minLength": 10}, "type": {"type": "string", "enum": ["multiple_choice"]}, "options": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 6}, "required": {"type": "boolean"}}, "required": ["id", "text", "type", "options", "required"]}, "minItems": 3, "maxItems": 10}}, "required": ["questions"]}$$
WHERE name = 'questions_generation';
