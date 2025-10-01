-- Create utility functions for the team design app

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_team_design_flows_updated_at
  BEFORE UPDATE ON team_design_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_logos_updated_at
  BEFORE UPDATE ON team_logos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_sets_updated_at
  BEFORE UPDATE ON question_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logo_prompts_updated_at
  BEFORE UPDATE ON logo_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get question set for team
CREATE OR REPLACE FUNCTION get_question_set_for_team(
  p_sport VARCHAR,
  p_age_group VARCHAR
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  questions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qs.id,
    qs.name,
    qs.questions
  FROM question_sets qs
  WHERE qs.active = true
    AND (qs.sport = p_sport OR qs.sport IS NULL)
    AND (qs.age_group = p_age_group OR qs.age_group IS NULL)
  ORDER BY 
    CASE WHEN qs.sport = p_sport AND qs.age_group = p_age_group THEN 1 ELSE 2 END,
    qs.sort_order
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to log debug information
CREATE OR REPLACE FUNCTION log_debug(
  p_flow_id UUID,
  p_level VARCHAR,
  p_category VARCHAR,
  p_message TEXT,
  p_context JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO debug_logs (flow_id, log_level, category, message, context)
  VALUES (p_flow_id, p_level, p_category, p_message, p_context)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record system metrics
CREATE OR REPLACE FUNCTION record_metric(
  p_metric_name VARCHAR,
  p_metric_value NUMERIC,
  p_metric_unit VARCHAR DEFAULT NULL,
  p_time_period VARCHAR DEFAULT 'hour'
)
RETURNS UUID AS $$
DECLARE
  metric_id UUID;
BEGIN
  INSERT INTO system_metrics (metric_name, metric_value, metric_unit, time_period)
  VALUES (p_metric_name, p_metric_value, p_metric_unit, p_time_period)
  RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$$ LANGUAGE plpgsql;

-- Function to track error patterns
CREATE OR REPLACE FUNCTION track_error(
  p_error_type VARCHAR,
  p_error_message TEXT
)
RETURNS UUID AS $$
DECLARE
  error_id UUID;
BEGIN
  -- Try to update existing error pattern
  UPDATE error_patterns 
  SET 
    occurrence_count = occurrence_count + 1,
    last_occurrence = NOW()
  WHERE error_type = p_error_type 
    AND error_message = p_error_message
  RETURNING id INTO error_id;
  
  -- If no existing pattern found, create new one
  IF error_id IS NULL THEN
    INSERT INTO error_patterns (error_type, error_message)
    VALUES (p_error_type, p_error_message)
    RETURNING id INTO error_id;
  END IF;
  
  RETURN error_id;
END;
$$ LANGUAGE plpgsql;
