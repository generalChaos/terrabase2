-- Add sort_order field to prompt_definitions table
ALTER TABLE prompt_definitions 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index for efficient ordering
CREATE INDEX idx_prompt_definitions_sort_order ON prompt_definitions(sort_order);

-- Update existing prompts with sort_order based on creation time
UPDATE prompt_definitions 
SET sort_order = EXTRACT(EPOCH FROM created_at)::INTEGER
WHERE sort_order = 0;

-- Set proper sort_order values for better organization
UPDATE prompt_definitions 
SET sort_order = CASE 
  WHEN name = 'image_analysis' THEN 1
  WHEN name = 'questions_generation' THEN 2
  WHEN name = 'conversational_question' THEN 3
  WHEN name = 'image_prompt_creation' THEN 4
  WHEN name = 'text_processing' THEN 5
  WHEN name = 'image_text_analysis' THEN 6
  ELSE sort_order
END;
