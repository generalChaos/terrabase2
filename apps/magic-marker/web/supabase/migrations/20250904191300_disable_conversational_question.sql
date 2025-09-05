-- Disable the conversational_question prompt for now
-- We'll come back to this when we have more time to properly debug it

UPDATE prompt_definitions 
SET 
  active = false,
  updated_at = NOW()
WHERE name = 'conversational_question';
