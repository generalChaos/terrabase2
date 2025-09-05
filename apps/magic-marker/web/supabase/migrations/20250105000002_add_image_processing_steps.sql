-- Add image_processing_steps table for step logging
CREATE TABLE IF NOT EXISTS image_processing_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL,
  step_type VARCHAR(100) NOT NULL,
  step_order INTEGER NOT NULL,
  input_data JSONB,
  output_data JSONB,
  response_time_ms INTEGER,
  model_used VARCHAR(100),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_image_processing_steps_flow_id ON image_processing_steps(flow_id);
CREATE INDEX IF NOT EXISTS idx_image_processing_steps_created_at ON image_processing_steps(created_at);

-- Enable Row Level Security
ALTER TABLE image_processing_steps ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (adjust as needed for your use case)
CREATE POLICY "Allow public access" ON image_processing_steps FOR ALL USING (true);
