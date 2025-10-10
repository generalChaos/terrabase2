-- Remove age_group column from team_design_flows table
-- This migration updates the schema to match the new V1 flow without age groups

-- Drop the age_group column from team_design_flows
ALTER TABLE team_design_flows DROP COLUMN IF EXISTS age_group;

-- Update the round1_answers structure to include logo_style instead of age_group
-- Note: This is a structural change that will be handled by the application layer
-- The round1_answers JSONB field will now contain:
-- {
--   "team_name": "string",
--   "sport": "string", 
--   "logo_style": "string"
-- }

-- Update question_sets table to remove age_group references
-- Make age_group nullable since we're removing it from the main flow
ALTER TABLE question_sets ALTER COLUMN age_group DROP NOT NULL;

-- Add a comment to document the schema change
COMMENT ON TABLE team_design_flows IS 'Updated V1 schema: Removed age_group, added logo_style support in round1_answers';
COMMENT ON COLUMN team_design_flows.round1_answers IS 'JSONB containing team_name, sport, and logo_style for V1 flow';

