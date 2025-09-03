-- Migration: Create prompt management system
-- Created: 2024-12-01
-- Description: Add tables for managing AI prompts and tracking conversations

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL, -- 'image_analysis', 'image_generation', etc.
  content TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one active prompt per name
  UNIQUE(name)
);

-- Create ai_conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  input_data JSONB, -- What we sent to AI
  output_data JSONB, -- What AI returned
  response_time_ms INTEGER,
  tokens_used INTEGER,
  model_used VARCHAR,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompts_name ON prompts(name);
CREATE INDEX IF NOT EXISTS idx_prompts_active ON prompts(active);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_prompt_id ON ai_conversations(prompt_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_success ON ai_conversations(success);

-- Enable Row Level Security
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public app)
CREATE POLICY "Allow public read access to prompts" ON prompts
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to ai_conversations" ON ai_conversations
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to ai_conversations" ON ai_conversations
  FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_prompts_updated_at 
  BEFORE UPDATE ON prompts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial prompts (extracted from current OpenAIService)
INSERT INTO prompts (name, content, active) VALUES 
(
  'image_analysis',
  'Analyze this image and return ONLY JSON with this exact schema:

{
  "analysis": "2–3 sentences describing what you see.",
  "questions": [
    {"text": "question text", "options": ["option1", "option2", "option3", "option4"], "required": true},
    ... exactly 10 items total ...
  ]
}

Rules:
- questions MUST be exactly 10 items.
- Each question must have exactly 4 multiple choice options.
- required is always true.
- No extra keys. No preamble. No markdown. Only JSON.',
  true
),
(
  'image_prompt_creation_system',
  'You are a creative AI that generates image prompts. Create a detailed, artistic prompt based on the questions and answers provided.',
  true
),
(
  'image_prompt_creation_user',
  'Based on these questions and answers, create a detailed image generation prompt for DALL-E 3:

Questions and Answers:
{questions_and_answers}

Generate a creative, detailed prompt that incorporates all the answers. Focus on visual elements, style, mood, and composition. Make it specific and artistic.',
  true
);

-- Create a view for easy prompt analytics
CREATE OR REPLACE VIEW prompt_analytics AS
SELECT 
  p.id as prompt_id,
  p.name as prompt_name,
  COUNT(ac.id) as total_requests,
  COUNT(CASE WHEN ac.success THEN 1 END) as successful_requests,
  COUNT(CASE WHEN ac.success THEN 1 END) * 100.0 / NULLIF(COUNT(ac.id), 0) as success_rate,
  AVG(ac.response_time_ms) as avg_response_time_ms,
  SUM(ac.tokens_used) as total_tokens_used,
  MAX(ac.created_at) as last_used,
  MIN(ac.created_at) as first_used
FROM prompts p
LEFT JOIN ai_conversations ac ON p.id = ac.prompt_id
GROUP BY p.id, p.name;

-- Grant access to the view
GRANT SELECT ON prompt_analytics TO anon, authenticated;
