-- Add sort_order column to prompts table for ordering functionality

-- Add the sort_order column with default value 0
ALTER TABLE prompts ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Update existing prompts with default sort order values
-- This will give them a logical order based on their current sequence
UPDATE prompts SET sort_order = 10 WHERE name = 'image_analysis';
UPDATE prompts SET sort_order = 20 WHERE name = 'image_prompt_creation_system';
UPDATE prompts SET sort_order = 30 WHERE name = 'image_prompt_creation_user';

-- Create an index on sort_order for better query performance
CREATE INDEX idx_prompts_sort_order ON prompts(sort_order);

-- Add a comment to document the column purpose
COMMENT ON COLUMN prompts.sort_order IS 'Order for displaying prompts in admin interface and for A/B testing priority';
