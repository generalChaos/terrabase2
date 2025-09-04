-- Add new prompt types to the constraint
ALTER TABLE prompt_definitions 
DROP CONSTRAINT prompt_definitions_type_check;

ALTER TABLE prompt_definitions 
ADD CONSTRAINT prompt_definitions_type_check 
CHECK (type IN (
  'image_analysis',
  'questions_generation', 
  'conversational_question',
  'image_prompt_creation',
  'answer_analysis',
  'image_generation',
  'conversation_summary',
  'artistic_style_analysis',
  'mood_analysis',
  'composition_analysis',
  'text_processing',
  'image_text_analysis'
));
