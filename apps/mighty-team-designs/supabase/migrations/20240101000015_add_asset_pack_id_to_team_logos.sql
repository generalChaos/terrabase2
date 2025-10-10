-- Add asset_pack_id column to team_logos table for bidirectional relationship
ALTER TABLE team_logos 
ADD COLUMN asset_pack_id UUID REFERENCES logo_asset_packs(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_team_logos_asset_pack_id ON team_logos(asset_pack_id);

-- Add comment to explain the field
COMMENT ON COLUMN team_logos.asset_pack_id IS 'Reference to the corresponding asset pack for this logo variant';

-- Update existing team_logos records to have asset_pack_id
-- This will populate the asset_pack_id for existing logos that have asset packs
UPDATE team_logos 
SET asset_pack_id = lap.id
FROM logo_asset_packs lap
WHERE team_logos.id = lap.logo_id;
