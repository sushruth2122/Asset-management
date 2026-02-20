-- Extend spare_parts table with additional fields
ALTER TABLE public.spare_parts
ADD COLUMN IF NOT EXISTS description text DEFAULT '',
ADD COLUMN IF NOT EXISTS supplier text DEFAULT '',
ADD COLUMN IF NOT EXISTS storage_location text DEFAULT '',
ADD COLUMN IF NOT EXISTS minimum_threshold integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS reorder_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS warranty_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'In Stock';

-- Create unique index on part_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_spare_parts_part_number_unique ON public.spare_parts(part_number);