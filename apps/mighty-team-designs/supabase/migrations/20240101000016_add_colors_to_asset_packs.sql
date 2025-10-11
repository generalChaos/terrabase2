-- Add colors column to logo_asset_packs table
ALTER TABLE logo_asset_packs 
ADD COLUMN colors JSONB;

-- Add comment to describe the column
COMMENT ON COLUMN logo_asset_packs.colors IS 'Color analysis results including colors, frequencies, percentages, and total pixels analyzed';
