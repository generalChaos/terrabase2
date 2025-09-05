-- Add sort_order to prompt_definitions to control the order of steps
-- This will allow us to dynamically determine the pipeline steps

ALTER TABLE prompt_definitions 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Set sort_order for existing prompts to establish the pipeline order
UPDATE prompt_definitions 
SET sort_order = CASE 
  WHEN name = 'image_analysis' THEN 1
  WHEN name = 'questions_generation' THEN 2
  WHEN name = 'answer_analysis' THEN 3
  WHEN name = 'image_prompt_creation' THEN 4
  WHEN name = 'image_generation' THEN 5
  WHEN name = 'conversation_summary' THEN 6
  WHEN name = 'artistic_style_analysis' THEN 7
  WHEN name = 'mood_analysis' THEN 8
  WHEN name = 'composition_analysis' THEN 9
  WHEN name = 'text_processing' THEN 10
  WHEN name = 'image_text_analysis' THEN 11
  WHEN name = 'conversational_question' THEN 12
  ELSE 999
END;

-- Create an index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_prompt_definitions_sort_order 
ON prompt_definitions(sort_order, active);
