-- Clean setup for Magic Marker with hybrid schema
-- This replaces all previous migrations with a single clean state

-- Create prompt_definitions table
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
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create images table (clean and simple)
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_result TEXT NOT NULL,
  image_type VARCHAR NOT NULL CHECK (image_type IN ('original', 'additional', 'final')),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analysis_flows table (hybrid approach)
CREATE TABLE analysis_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  
  -- Image References
  original_image_id UUID NOT NULL REFERENCES images(id),
  additional_image_ids UUID[] DEFAULT '{}',
  final_image_id UUID REFERENCES images(id),
  
  -- Normalized counters for easy querying
  total_questions INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  current_step VARCHAR,
  
  -- Flexible JSONB data for complex structures
  questions JSONB DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  context_data JSONB DEFAULT '{}',
  
  -- Cost tracking
  total_cost_usd DECIMAL(10,6) DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_prompt_definitions_name ON prompt_definitions(name);
CREATE INDEX idx_prompt_definitions_type ON prompt_definitions(type);
CREATE INDEX idx_prompt_definitions_active ON prompt_definitions(active);

CREATE INDEX idx_images_type ON images(image_type);
CREATE INDEX idx_images_created_at ON images(created_at);

CREATE INDEX idx_analysis_flows_session_id ON analysis_flows(session_id);
CREATE INDEX idx_analysis_flows_original_image_id ON analysis_flows(original_image_id);
CREATE INDEX idx_analysis_flows_is_active ON analysis_flows(is_active);
CREATE INDEX idx_analysis_flows_created_at ON analysis_flows(created_at);
CREATE INDEX idx_analysis_flows_current_step ON analysis_flows(current_step);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_analysis_flows_questions_gin ON analysis_flows USING GIN (questions);
CREATE INDEX idx_analysis_flows_answers_gin ON analysis_flows USING GIN (answers);
CREATE INDEX idx_analysis_flows_context_gin ON analysis_flows USING GIN (context_data);

-- Enable RLS
ALTER TABLE prompt_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_flows ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow public access to prompt_definitions" ON prompt_definitions FOR ALL USING (true);
CREATE POLICY "Allow public access to images" ON images FOR ALL USING (true);
CREATE POLICY "Allow public access to analysis_flows" ON analysis_flows FOR ALL USING (true);

-- Add update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prompt_definitions_updated_at 
  BEFORE UPDATE ON prompt_definitions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_images_updated_at 
  BEFORE UPDATE ON images 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_flows_updated_at 
  BEFORE UPDATE ON analysis_flows 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON TABLE prompt_definitions TO anon, authenticated, service_role;
GRANT ALL ON TABLE images TO anon, authenticated, service_role;
GRANT ALL ON TABLE analysis_flows TO anon, authenticated, service_role;

-- Insert initial prompt definitions with "response" field and sort_order
INSERT INTO prompt_definitions (name, type, input_schema, output_schema, prompt_text, return_schema, model, response_format, sort_order) VALUES

-- Image Analysis Prompt
('image_analysis', 'image_analysis',
$${
  "type": "object",
  "properties": {
    "image": {"type": "string"},
    "context": {"type": "string"},
    "analysis_type": {"type": "string", "enum": ["general", "artistic", "technical", "child_drawing"]},
    "focus_areas": {"type": "array", "items": {"type": "string"}},
    "user_instructions": {"type": "string"}
  },
  "required": ["image"]
}$$,
$${
  "type": "object",
  "properties": {
    "response": {"type": "string", "minLength": 10},
    "confidence_score": {"type": "number", "minimum": 0, "maximum": 1},
    "identified_elements": {"type": "array", "items": {"type": "string"}},
    "artistic_notes": {"type": "string"},
    "technical_notes": {"type": "string"}
  },
  "required": ["response"]
}$$,
'Analyze this image and describe what you see in 2-3 sentences.',
$${
  "type": "object",
  "properties": {
    "response": {"type": "string"}
  },
  "required": ["response"]
}$$,
'gpt-4o', 'json_object', 10),

-- Questions Generation Prompt
('questions_generation', 'questions_generation',
$${
  "type": "object",
  "properties": {
    "response": {"type": "string"}
  },
  "required": ["response"]
}$$,
$${
  "type": "object",
  "properties": {
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "text": {"type": "string", "minLength": 10},
          "type": {"type": "string", "enum": ["multiple_choice"]},
          "options": {"type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 6},
          "required": {"type": "boolean"}
        },
        "required": ["id", "text", "type", "options", "required"]
      },
      "minItems": 3,
      "maxItems": 15
    },
    "response": {"type": "string"}
  },
  "required": ["questions"]
}$$,
'Based on the image analysis provided, generate exactly 8 creative questions that will help create an artistic image prompt. Return ONLY JSON with this exact schema:

{
  "questions": [
    {
      "id": "unique_id_1",
      "text": "question text",
      "type": "multiple_choice",
      "options": ["option1", "option2", "option3", "option4"],
      "required": true
    }
  ]
}

Rules:
- Generate exactly 8 questions
- Each question must have exactly 4 multiple choice options
- Questions should be about artistic style, mood, composition, colors, etc.
- required is always true
- No extra keys. No preamble. No markdown. Only JSON.',
$${
  "type": "object",
  "properties": {
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "text": {"type": "string"},
          "type": {"type": "string", "enum": ["multiple_choice"]},
          "options": {"type": "array", "items": {"type": "string"}},
          "required": {"type": "boolean"}
        },
        "required": ["id", "text", "type", "options", "required"]
      }
    }
  },
  "required": ["questions"]
}$$,
'gpt-4o', 'json_object', 20),

-- Conversational Question Prompt
('conversational_question', 'conversational_question',
$${
  "type": "object",
  "properties": {
    "response": {"type": "string"},
    "previousAnswers": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["response", "previousAnswers"]
}$$,
$${
  "type": "object",
  "properties": {
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "text": {"type": "string"},
          "type": {"type": "string", "enum": ["multiple_choice"]},
          "options": {"type": "array", "items": {"type": "string"}},
          "required": {"type": "boolean"}
        },
        "required": ["id", "text", "type", "options", "required"]
      }
    },
    "done": {"type": "boolean"},
    "summary": {"type": "string"},
    "response": {"type": "string"}
  },
  "required": ["questions", "done"]
}$$,
'You are an AI assistant that generates creative questions for artistic image generation. Based on the image analysis and previous answers, generate exactly 1 question with 4 options to help create a personalized artistic prompt.

Return ONLY JSON with this exact schema:

{
  "questions": [
    {
      "id": "unique_id_1",
      "text": "What style would you like for your image?",
      "type": "multiple_choice",
      "options": ["Realistic", "Cartoon", "Abstract", "None"],
      "required": true
    }
  ],
  "done": false
}

Rules:
- Generate exactly 1 question (not an array)
- Each question must have exactly 4 options
- One option must always be "None" for flexibility
- Questions should be about artistic style, mood, composition, colors, lighting, etc.
- Build on previous answers to create a more personalized experience
- Set done: true when you have enough information (max 20 questions)
- No extra keys. No preamble. No markdown. Only JSON.',
$${
  "type": "object",
  "properties": {
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "text": {"type": "string"},
          "type": {"type": "string", "enum": ["multiple_choice"]},
          "options": {"type": "array", "items": {"type": "string"}},
          "required": {"type": "boolean"}
        },
        "required": ["id", "text", "type", "options", "required"]
      }
    },
    "done": {"type": "boolean"},
    "summary": {"type": "string"}
  },
  "required": ["questions", "done"]
}$$,
'gpt-4o', 'json_object', 30),

-- Image Generation Prompt
('image_generation', 'image_generation',
$${
  "type": "object",
  "properties": {
    "prompt": {"type": "string", "minLength": 10}
  },
  "required": ["prompt"]
}$$,
$${
  "type": "object",
  "properties": {
    "image_base64": {"type": "string"},
    "response": {"type": "string"}
  },
  "required": ["image_base64"]
}$$,
'Generate a high-quality artistic image based on the provided prompt. Return the image as a base64-encoded string.',
$${
  "type": "object",
  "properties": {
    "image_base64": {"type": "string"}
  },
  "required": ["image_base64"]
}$$,
'dall-e-3', 'json_object', 40);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the images bucket (if they don't exist)
DO $$
BEGIN
    -- Create read policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access to images' AND tablename = 'objects') THEN
        CREATE POLICY "Allow public read access to images" ON storage.objects
          FOR SELECT USING (bucket_id = 'images');
    END IF;
    
    -- Create upload policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public upload to images' AND tablename = 'objects') THEN
        CREATE POLICY "Allow public upload to images" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = 'images');
    END IF;
    
    -- Create update policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update to images' AND tablename = 'objects') THEN
        CREATE POLICY "Allow public update to images" ON storage.objects
          FOR UPDATE USING (bucket_id = 'images');
    END IF;
    
    -- Create delete policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public delete from images' AND tablename = 'objects') THEN
        CREATE POLICY "Allow public delete from images" ON storage.objects
          FOR DELETE USING (bucket_id = 'images');
    END IF;
END $$;
