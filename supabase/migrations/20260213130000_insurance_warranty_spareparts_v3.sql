-- ============================================================
-- FIX: Insurance/Warranty storage + Spare parts inventory
-- Additive only. No drops. No recreates.
-- CRITICAL: No CONCURRENTLY — migrations run inside a transaction.
-- ============================================================

-- ── 0. Storage bucket FIRST (everything depends on this) ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-protection-docs', 'asset-protection-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload
CREATE POLICY "Allow authenticated uploads"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-protection-docs');

-- Storage RLS: authenticated users can read
CREATE POLICY "Allow authenticated read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'asset-protection-docs');

-- Storage RLS: authenticated users can delete
CREATE POLICY "Allow authenticated delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'asset-protection-docs');

-- ── 1. asset_insurance: add columns ──
ALTER TABLE public.asset_insurance
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS document_name TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_asset_insurance_asset
  ON public.asset_insurance(asset_id);

-- ── 2. asset_warranties table ──
CREATE TABLE IF NOT EXISTS public.asset_warranties (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id       UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  provider       TEXT NOT NULL,
  warranty_type  TEXT NOT NULL DEFAULT 'standard',
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  terms          TEXT,
  document_url   TEXT,
  storage_path   TEXT,
  document_name  TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_warranties_asset_id
  ON public.asset_warranties(asset_id);

ALTER TABLE public.asset_warranties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view asset warranties"
  ON public.asset_warranties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert asset warranties"
  ON public.asset_warranties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update asset warranties"
  ON public.asset_warranties FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete asset warranties"
  ON public.asset_warranties FOR DELETE TO authenticated USING (true);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_asset_warranties_updated_at'
  ) THEN
    CREATE TRIGGER update_asset_warranties_updated_at
      BEFORE UPDATE ON public.asset_warranties
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ── 3. Spare parts: stock log ──
CREATE TABLE IF NOT EXISTS public.spare_parts_stock_log (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id            UUID NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  change_amount      INTEGER NOT NULL,
  resulting_quantity INTEGER NOT NULL,
  action             TEXT NOT NULL CHECK (action IN ('add', 'remove', 'adjust')),
  performed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_log_part_id
  ON public.spare_parts_stock_log(part_id, created_at DESC);

ALTER TABLE public.spare_parts_stock_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock log"
  ON public.spare_parts_stock_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert stock log"
  ON public.spare_parts_stock_log FOR INSERT TO authenticated WITH CHECK (true);

-- ── 4. Spare parts: purchase orders ──
CREATE TABLE IF NOT EXISTS public.spare_parts_purchase_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id           UUID NOT NULL REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  vendor            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
  expected_delivery DATE,
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_part_id
  ON public.spare_parts_purchase_orders(part_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status
  ON public.spare_parts_purchase_orders(status) WHERE status != 'received';

ALTER TABLE public.spare_parts_purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow authenticated insert"
  ON public.spare_parts_purchase_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow authenticated select"
  ON public.spare_parts_purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow authenticated update"
  ON public.spare_parts_purchase_orders FOR UPDATE TO authenticated USING (true);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchase_orders_updated_at'
  ) THEN
    CREATE TRIGGER update_purchase_orders_updated_at
      BEFORE UPDATE ON public.spare_parts_purchase_orders
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ── 5. Index spare_parts.quantity for low-stock queries ──
CREATE INDEX IF NOT EXISTS idx_spare_parts_quantity
  ON public.spare_parts(quantity);
