-- Create logo_asset_packs table to store asset pack data for each logo variant
CREATE TABLE logo_asset_packs (
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
CREATE INDEX idx_logo_asset_packs_flow_id ON logo_asset_packs(flow_id);
CREATE INDEX idx_logo_asset_packs_logo_id ON logo_asset_packs(logo_id);
CREATE INDEX idx_logo_asset_packs_asset_pack_id ON logo_asset_packs(asset_pack_id);

-- Add RLS policies
ALTER TABLE logo_asset_packs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to asset packs
CREATE POLICY "Allow public read access to logo asset packs" ON logo_asset_packs
  FOR SELECT USING (true);

-- Allow authenticated users to insert asset packs
CREATE POLICY "Allow authenticated users to insert logo asset packs" ON logo_asset_packs
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update asset packs
CREATE POLICY "Allow authenticated users to update logo asset packs" ON logo_asset_packs
  FOR UPDATE USING (true);

-- Allow authenticated users to delete asset packs
CREATE POLICY "Allow authenticated users to delete logo asset packs" ON logo_asset_packs
  FOR DELETE USING (true);
