-- Add generation_params field to team_logos table for cost tracking
ALTER TABLE team_logos 
ADD COLUMN generation_params JSONB;

-- Add comment to explain the field
COMMENT ON COLUMN team_logos.generation_params IS 'JSON object containing generation parameters (size, quality, n, model) for cost calculation and analytics';
