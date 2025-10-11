-- Add player roster column to team_design_flows table
ALTER TABLE team_design_flows
ADD COLUMN player_roster JSONB;

-- Add index for player_roster for faster queries
CREATE INDEX idx_team_design_flows_player_roster ON team_design_flows USING GIN (player_roster);
