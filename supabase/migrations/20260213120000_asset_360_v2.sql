-- ============================================================
-- ASSET 360 v2 — Additive migration (no drops, no breaks)
-- ============================================================

-- ── 1. Depreciation / Financial fields on assets ──
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(15, 2);
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS acquisition_date DATE;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS useful_life_years INT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS depreciation_rate NUMERIC(5, 2);
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS salvage_value NUMERIC(15, 2);

-- Backfill purchase_price from purchase_value
UPDATE public.assets SET purchase_price = purchase_value WHERE purchase_price IS NULL;
UPDATE public.assets SET acquisition_date = purchase_date::date WHERE acquisition_date IS NULL AND purchase_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_acquisition_date
  ON public.assets(acquisition_date);

-- ── 2. Insurance — add document_url and reminder_enabled ──
ALTER TABLE public.asset_insurance ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE public.asset_insurance ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN NOT NULL DEFAULT false;

-- ── 3. Lifecycle events — add title column, widen event_type check ──
ALTER TABLE public.asset_lifecycle_events ADD COLUMN IF NOT EXISTS title TEXT;

-- Drop old CHECK and add wider one to accommodate all enterprise event types
ALTER TABLE public.asset_lifecycle_events DROP CONSTRAINT IF EXISTS asset_lifecycle_events_event_type_check;
ALTER TABLE public.asset_lifecycle_events ADD CONSTRAINT asset_lifecycle_events_event_type_check
  CHECK (event_type IN (
    'commissioned', 'relocated', 'maintenance_start', 'maintenance_end',
    'deactivated', 'reactivated', 'retired', 'disposed', 'transferred', 'inspected',
    'acquired', 'deployed', 'maintenance', 'repair', 'transfer', 'returned', 'decommissioned'
  ));

-- Composite index for timeline ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lifecycle_events_asset_performed
  ON public.asset_lifecycle_events(asset_id, event_date DESC);

-- ── 4. Documents — add 'name' alias column for clarity ──
ALTER TABLE public.asset_documents ADD COLUMN IF NOT EXISTS name TEXT;
-- Backfill name from document_name
UPDATE public.asset_documents SET name = document_name WHERE name IS NULL;

-- ── 5. Storage buckets (must be run via Supabase dashboard or supabase CLI) ──
-- INSERT INTO storage.buckets (id, name, public) VALUES ('asset-documents', 'asset-documents', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('asset-insurance', 'asset-insurance', false) ON CONFLICT DO NOTHING;
-- Storage RLS policies:
-- CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('asset-documents', 'asset-insurance'));
-- CREATE POLICY "Authenticated read"   ON storage.objects FOR SELECT TO authenticated USING (bucket_id IN ('asset-documents', 'asset-insurance'));
-- CREATE POLICY "Authenticated delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('asset-documents', 'asset-insurance'));
