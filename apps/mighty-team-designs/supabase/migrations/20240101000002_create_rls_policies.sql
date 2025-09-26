-- Enable Row Level Security (RLS) on all tables
ALTER TABLE team_design_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE logo_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_patterns ENABLE ROW LEVEL SECURITY;

-- Team design flows policies
-- Anyone can create team design flows
CREATE POLICY "Anyone can create team design flows" ON team_design_flows
  FOR INSERT WITH CHECK (true);

-- Anyone can update team design flows
CREATE POLICY "Anyone can update team design flows" ON team_design_flows
  FOR UPDATE USING (true);

-- Anyone can read team design flows
CREATE POLICY "Anyone can read team design flows" ON team_design_flows
  FOR SELECT USING (true);

-- Team logos policies
-- Anyone can create team logos
CREATE POLICY "Anyone can create team logos" ON team_logos
  FOR INSERT WITH CHECK (true);

-- Anyone can update team logos
CREATE POLICY "Anyone can update team logos" ON team_logos
  FOR UPDATE USING (true);

-- Anyone can read team logos
CREATE POLICY "Anyone can read team logos" ON team_logos
  FOR SELECT USING (true);

-- Question sets policies
-- Public read access for active question sets
CREATE POLICY "Question sets are publicly readable" ON question_sets
  FOR SELECT USING (active = true);

-- Logo prompts policies
-- Public read access for active logo prompts
CREATE POLICY "Logo prompts are publicly readable" ON logo_prompts
  FOR SELECT USING (active = true);

-- Debug logs policies
-- Anyone can create debug logs
CREATE POLICY "Anyone can create debug logs" ON debug_logs
  FOR INSERT WITH CHECK (true);

-- Anyone can read debug logs
CREATE POLICY "Anyone can read debug logs" ON debug_logs
  FOR SELECT USING (true);

-- System metrics policies
-- Anyone can create system metrics
CREATE POLICY "Anyone can create system metrics" ON system_metrics
  FOR INSERT WITH CHECK (true);

-- Anyone can read system metrics
CREATE POLICY "Anyone can read system metrics" ON system_metrics
  FOR SELECT USING (true);

-- Error patterns policies
-- Anyone can create error patterns
CREATE POLICY "Anyone can create error patterns" ON error_patterns
  FOR INSERT WITH CHECK (true);

-- Anyone can update error patterns
CREATE POLICY "Anyone can update error patterns" ON error_patterns
  FOR UPDATE USING (true);

-- Anyone can read error patterns
CREATE POLICY "Anyone can read error patterns" ON error_patterns
  FOR SELECT USING (true);
