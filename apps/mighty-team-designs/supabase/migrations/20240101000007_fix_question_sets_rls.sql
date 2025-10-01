-- Fix question_sets RLS policies
-- Drop existing policies and recreate with correct column name
DROP POLICY IF EXISTS "Question sets are publicly readable" ON question_sets;
DROP POLICY IF EXISTS "Anyone can create question sets" ON question_sets;

-- Create correct policies for question_sets
CREATE POLICY "Question sets are publicly readable" ON question_sets
  FOR SELECT USING (active = true);

-- Anyone can create question sets
CREATE POLICY "Anyone can create question sets" ON question_sets
  FOR INSERT WITH CHECK (true);
