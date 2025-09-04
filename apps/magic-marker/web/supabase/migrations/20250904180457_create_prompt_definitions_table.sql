-- Create prompt_definitions table for the new prompt system
CREATE TABLE prompt_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN (
    'image_analysis',
    'questions_generation', 
    'conversational_question',
    'image_prompt_creation',
    'answer_analysis',
    'image_generation',
    'conversation_summary',
    'artistic_style_analysis',
    'mood_analysis',
    'composition_analysis'
  )),
  
  -- Input/Output Schemas (JSONB for validation)
  input_schema JSONB NOT NULL,
  output_schema JSONB NOT NULL,
  
  -- Prompt Components
  prompt_text TEXT NOT NULL,
  return_schema JSONB NOT NULL,
  
  -- Model Configuration
  model VARCHAR NOT NULL DEFAULT 'gpt-4o',
  response_format VARCHAR NOT NULL DEFAULT 'json_object' CHECK (response_format IN ('json_object', 'text')),
  max_tokens INTEGER,
  temperature DECIMAL(2,1) CHECK (temperature >= 0 AND temperature <= 2),
  
  -- Metadata
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_prompt_definitions_name ON prompt_definitions(name);
CREATE INDEX idx_prompt_definitions_type ON prompt_definitions(type);
CREATE INDEX idx_prompt_definitions_active ON prompt_definitions(active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_prompt_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prompt_definitions_updated_at
  BEFORE UPDATE ON prompt_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_definitions_updated_at();

-- Insert initial prompt definitions for our core types
-- We'll start with just the table structure and add the data separately

-- Enable RLS (Row Level Security)
ALTER TABLE prompt_definitions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on prompt_definitions" ON prompt_definitions
  FOR ALL USING (true);
