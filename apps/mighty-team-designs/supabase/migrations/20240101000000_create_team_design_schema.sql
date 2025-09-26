-- Create team design flows table
CREATE TABLE team_design_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_session_id UUID NOT NULL, -- Anonymous session tracking
  team_name VARCHAR NOT NULL,
  sport VARCHAR NOT NULL,
  age_group VARCHAR NOT NULL,
  
  -- Round 1 answers
  round1_answers JSONB NOT NULL DEFAULT '{}',
  
  -- Round 2 questions and answers
  round2_questions JSONB NOT NULL DEFAULT '[]',
  round2_answers JSONB NOT NULL DEFAULT '[]',
  
  -- Generated logo data
  logo_prompt TEXT,
  logo_variants JSONB NOT NULL DEFAULT '[]', -- Array of logo variants
  selected_logo_id UUID, -- Will reference team_logos after creation
  logo_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- Flow state
  current_step VARCHAR DEFAULT 'round1', -- 'round1', 'round2', 'generating', 'completed', 'failed'
  debug_mode BOOLEAN DEFAULT false, -- Feature flag for detailed state tracking
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team logos table
CREATE TABLE team_logos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES team_design_flows(id) ON DELETE CASCADE,
  
  -- Image data (Supabase Storage paths)
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size INTEGER,
  mime_type VARCHAR,
  storage_bucket VARCHAR DEFAULT 'team-logos',
  
  -- Logo metadata
  variant_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  is_selected BOOLEAN DEFAULT false,
  generation_prompt TEXT, -- Specific prompt used for this variant
  
  -- AI generation data
  model_used VARCHAR, -- 'gpt-image-1', etc.
  generation_time_ms INTEGER,
  generation_cost_usd NUMERIC(10,6),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for selected_logo_id
ALTER TABLE team_design_flows 
ADD CONSTRAINT fk_team_design_flows_selected_logo 
FOREIGN KEY (selected_logo_id) REFERENCES team_logos(id);

-- Create question sets table
CREATE TABLE question_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL, -- 'youth_sports', 'adult_recreational', etc.
  sport VARCHAR, -- 'soccer', 'basketball', etc. (NULL for all sports)
  age_group VARCHAR, -- 'U8', 'U12', 'adult', etc. (NULL for all ages)
  
  -- Question data
  questions JSONB NOT NULL, -- Array of question objects
  
  -- Generation metadata
  is_generated BOOLEAN DEFAULT false, -- True if AI-generated, false if manually created
  generation_prompt TEXT, -- Prompt used to generate questions
  generation_model VARCHAR, -- AI model used for generation
  
  -- Metadata
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(sport, age_group, name)
);

-- Create logo prompts table
CREATE TABLE logo_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE, -- 'team_logo_generation', 'logo_variant_generation', etc.
  
  -- Prompt data
  prompt_text TEXT NOT NULL,
  model VARCHAR DEFAULT 'gpt-image-1', -- Updated to use gpt-image-1
  response_format VARCHAR DEFAULT 'b64_json',
  max_tokens INTEGER,
  temperature NUMERIC(2,1) DEFAULT 0.7,
  
  -- Prompt metadata
  description TEXT,
  input_schema JSONB, -- Schema for expected inputs
  output_schema JSONB, -- Schema for expected outputs
  
  -- Metadata
  active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create debug logs table
CREATE TABLE debug_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID REFERENCES team_design_flows(id) ON DELETE CASCADE,
  log_level VARCHAR NOT NULL, -- 'debug', 'info', 'warn', 'error'
  category VARCHAR NOT NULL, -- 'question_generation', 'logo_generation', 'api', 'database'
  message TEXT NOT NULL,
  context JSONB, -- Additional debug context
  stack_trace TEXT, -- For errors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system metrics table
CREATE TABLE system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name VARCHAR NOT NULL, -- 'success_rate', 'error_rate', 'avg_generation_time'
  metric_value NUMERIC NOT NULL,
  metric_unit VARCHAR, -- 'percentage', 'seconds', 'count'
  time_period VARCHAR NOT NULL, -- 'hour', 'day', 'week'
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create error patterns table
CREATE TABLE error_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type VARCHAR NOT NULL, -- 'openai_timeout', 'question_generation_failed'
  error_message TEXT NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  first_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false
);
