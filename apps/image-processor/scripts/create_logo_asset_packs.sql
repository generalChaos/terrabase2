-- Create logo_asset_packs table to store asset pack data for each logo variant
-- Run this SQL in your Supabase dashboard SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS logo_asset_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES team_design_flows(id) ON DELETE CASCADE,
  logo_id UUID NOT NULL REFERENCES team_logos(id) ON DELETE CASCADE,
  asset_pack_id VARCHAR NOT NULL,
  clean_logo_url TEXT NOT NULL,
  tshirt_front_url TEXT NOT NULL,
  tshirt_back_url TEXT NOT NULL,
  banner_url TEXT,
  processing_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_logo_asset_packs_flow_id ON logo_asset_packs(flow_id);
CREATE INDEX IF NOT EXISTS idx_logo_asset_packs_logo_id ON logo_asset_packs(logo_id);
CREATE INDEX IF NOT EXISTS idx_logo_asset_packs_asset_pack_id ON logo_asset_packs(asset_pack_id);

-- Enable RLS
ALTER TABLE logo_asset_packs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to logo asset packs" ON logo_asset_packs;
DROP POLICY IF EXISTS "Allow authenticated users to insert logo asset packs" ON logo_asset_packs;
DROP POLICY IF EXISTS "Allow authenticated users to update logo asset packs" ON logo_asset_packs;
DROP POLICY IF EXISTS "Allow authenticated users to delete logo asset packs" ON logo_asset_packs;

CREATE POLICY "Allow public read access to logo asset packs" ON logo_asset_packs
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert logo asset packs" ON logo_asset_packs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update logo asset packs" ON logo_asset_packs
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users to delete logo asset packs" ON logo_asset_packs
  FOR DELETE USING (true);

-- Add colors column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'logo_asset_packs' 
        AND column_name = 'colors'
    ) THEN
        ALTER TABLE logo_asset_packs ADD COLUMN colors JSONB;
        COMMENT ON COLUMN logo_asset_packs.colors IS 'Color analysis results including colors, frequencies, percentages, and total pixels analyzed';
    END IF;
END $$;

-- Verify the table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'logo_asset_packs'
ORDER BY ordinal_position;
