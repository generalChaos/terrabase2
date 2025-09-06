-- Clean up image_analysis input_schema to remove unused properties
UPDATE prompt_definitions 
SET input_schema = '{"type": "object", "required": ["image"], "properties": {"image": {"type": "string"}}}'
WHERE name = 'image_analysis';
