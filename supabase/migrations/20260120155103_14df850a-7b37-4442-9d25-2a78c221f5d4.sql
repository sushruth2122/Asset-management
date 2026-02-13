-- Extend assets table with new fields for Asset Master
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS manufacturer text DEFAULT '',
ADD COLUMN IF NOT EXISTS model text DEFAULT '',
ADD COLUMN IF NOT EXISTS serial_number text DEFAULT '',
ADD COLUMN IF NOT EXISTS warranty_expiry date,
ADD COLUMN IF NOT EXISTS custodian text DEFAULT '',
ADD COLUMN IF NOT EXISTS building_no text DEFAULT '',
ADD COLUMN IF NOT EXISTS asset_type text DEFAULT '',
ADD COLUMN IF NOT EXISTS specification text DEFAULT '',
ADD COLUMN IF NOT EXISTS voltage text DEFAULT '',
ADD COLUMN IF NOT EXISTS wattage text DEFAULT '',
ADD COLUMN IF NOT EXISTS depreciation text DEFAULT '',
ADD COLUMN IF NOT EXISTS insurance text DEFAULT '',
ADD COLUMN IF NOT EXISTS amc text DEFAULT '',
ADD COLUMN IF NOT EXISTS lease_status text DEFAULT '';

-- Create unique index on asset_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_asset_code_unique ON public.assets(asset_code);