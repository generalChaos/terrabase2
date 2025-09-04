-- Add conversation tracking columns to images table
ALTER TABLE images ADD COLUMN conversation_history JSONB DEFAULT '[]';
ALTER TABLE images ADD COLUMN conversation_complete BOOLEAN DEFAULT false;
ALTER TABLE images ADD COLUMN ai_ready_for_generation BOOLEAN DEFAULT false;

-- Add index for conversation queries
CREATE INDEX idx_images_conversation_complete ON images(conversation_complete);
CREATE INDEX idx_images_ai_ready ON images(ai_ready_for_generation);
