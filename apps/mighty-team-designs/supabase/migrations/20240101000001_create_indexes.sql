-- Create indexes for better query performance

-- Team design flows indexes
CREATE INDEX idx_team_design_flows_current_step ON team_design_flows(current_step);
CREATE INDEX idx_team_design_flows_created_at ON team_design_flows(created_at);
CREATE INDEX idx_team_design_flows_active ON team_design_flows(is_active);
CREATE INDEX idx_team_design_flows_sport_age ON team_design_flows(sport, age_group);
CREATE INDEX idx_team_design_flows_user_session ON team_design_flows(user_session_id);

-- Team logos indexes
CREATE INDEX idx_team_logos_flow_id ON team_logos(flow_id);
CREATE INDEX idx_team_logos_selected ON team_logos(is_selected);
CREATE INDEX idx_team_logos_created_at ON team_logos(created_at);
CREATE INDEX idx_team_logos_variant_number ON team_logos(flow_id, variant_number);

-- Question sets indexes
CREATE INDEX idx_question_sets_sport_age ON question_sets(sport, age_group);
CREATE INDEX idx_question_sets_active ON question_sets(active);
CREATE INDEX idx_question_sets_generated ON question_sets(is_generated);
CREATE INDEX idx_question_sets_sort_order ON question_sets(sort_order);

-- Logo prompts indexes
CREATE INDEX idx_logo_prompts_name ON logo_prompts(name);
CREATE INDEX idx_logo_prompts_active ON logo_prompts(active);
CREATE INDEX idx_logo_prompts_model ON logo_prompts(model);

-- Debug logs indexes
CREATE INDEX idx_debug_logs_flow_id ON debug_logs(flow_id);
CREATE INDEX idx_debug_logs_level ON debug_logs(log_level);
CREATE INDEX idx_debug_logs_category ON debug_logs(category);
CREATE INDEX idx_debug_logs_created_at ON debug_logs(created_at);

-- System metrics indexes
CREATE INDEX idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX idx_system_metrics_period ON system_metrics(time_period);
CREATE INDEX idx_system_metrics_recorded_at ON system_metrics(recorded_at);

-- Error patterns indexes
CREATE INDEX idx_error_patterns_type ON error_patterns(error_type);
CREATE INDEX idx_error_patterns_resolved ON error_patterns(resolved);
CREATE INDEX idx_error_patterns_last_occurrence ON error_patterns(last_occurrence);
