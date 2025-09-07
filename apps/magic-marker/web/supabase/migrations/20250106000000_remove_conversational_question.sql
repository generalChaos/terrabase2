-- Remove conversational_question from prompt_definitions type constraint
-- This migration removes the conversational_question type from the allowed types
-- since we've archived the conversational module

-- First, update any existing conversational_question prompts to be inactive
UPDATE prompt_definitions 
SET active = false 
WHERE type = 'conversational_question';

-- Drop the existing constraint
ALTER TABLE prompt_definitions 
DROP CONSTRAINT IF EXISTS prompt_definitions_type_check;

-- Create new constraint without conversational_question
ALTER TABLE prompt_definitions 
ADD CONSTRAINT prompt_definitions_type_check 
CHECK (("type")::text = ANY ((ARRAY[
  'image_analysis'::character varying, 
  'questions_generation'::character varying, 
  'image_prompt_creation'::character varying, 
  'answer_analysis'::character varying, 
  'image_generation'::character varying, 
  'conversation_summary'::character varying, 
  'artistic_style_analysis'::character varying, 
  'mood_analysis'::character varying, 
  'composition_analysis'::character varying,
  'text_processing'::character varying
])::"text"[]));

-- Add comment explaining the change
COMMENT ON CONSTRAINT prompt_definitions_type_check ON prompt_definitions 
IS 'Allowed prompt types - conversational_question removed as module was archived';
