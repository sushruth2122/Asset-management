-- ============================================================
-- ASSET 360 EVOLUTION — Phase 1: Safe Additive Migration
-- Zero downtime. Zero breaking changes. Backward compatible.
-- ============================================================

-- ── GOAL 1: Lifecycle Classification ──

ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT NOT NULL DEFAULT 'active'
  CHECK (lifecycle_stage IN ('planning', 'active', 'maintenance', 'inactive', 'retired', 'disposed'));

-- Backfill existing rows based on current status column
UPDATE public.assets SET lifecycle_stage = 'maintenance' WHERE status = 'Maintenance' AND lifecycle_stage = 'active';
UPDATE public.assets SET lifecycle_stage = 'inactive'    WHERE status = 'Inactive'    AND lifecycle_stage = 'active';

-- Index for the new lifecycle filter (high-impact for listing queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_lifecycle_stage
  ON public.assets(lifecycle_stage);

-- Composite index for the most common listing query pattern
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_lifecycle_created
  ON public.assets(lifecycle_stage, created_at DESC);

-- ── GOAL 2: Performance Indexes (from prior audit) ──

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_created_at_desc
  ON public.assets(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_status_created
  ON public.work_orders(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_assigned_status
  ON public.work_orders(assigned_to, status) WHERE assigned_to IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read_status) WHERE read_status = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_spare_parts_asset_id
  ON public.spare_parts(asset_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_asset_id
  ON public.work_orders(asset_id);

-- ── GOAL 4: Satellite Tables ──

-- Asset Documents
CREATE TABLE IF NOT EXISTS public.asset_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'general'
    CHECK (document_type IN ('manual', 'warranty', 'certificate', 'inspection', 'compliance', 'general')),
  file_url TEXT,
  file_size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Asset Insurance
CREATE TABLE IF NOT EXISTS public.asset_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  coverage_type TEXT DEFAULT 'comprehensive',
  premium_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  coverage_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Asset Financials (depreciation, cost tracking)
CREATE TABLE IF NOT EXISTS public.asset_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL
    CHECK (record_type IN ('depreciation', 'maintenance_cost', 'repair_cost', 'upgrade_cost', 'valuation')),
  amount NUMERIC(15, 2) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Asset Lifecycle Events (audit trail)
CREATE TABLE IF NOT EXISTS public.asset_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('commissioned', 'relocated', 'maintenance_start', 'maintenance_end', 'deactivated', 'reactivated', 'retired', 'disposed', 'transferred', 'inspected')),
  from_stage TEXT,
  to_stage TEXT,
  description TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ── Satellite Indexes ──

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_asset_documents_asset_id
  ON public.asset_documents(asset_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_asset_insurance_asset_id
  ON public.asset_insurance(asset_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_asset_financials_asset_id
  ON public.asset_financials(asset_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_asset_lifecycle_events_asset_id
  ON public.asset_lifecycle_events(asset_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_asset_lifecycle_events_type
  ON public.asset_lifecycle_events(asset_id, event_type);

-- ── RLS ──

ALTER TABLE public.asset_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_lifecycle_events ENABLE ROW LEVEL SECURITY;

-- All authenticated users can SELECT satellite data
CREATE POLICY "Authenticated users can view asset documents"
  ON public.asset_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view asset insurance"
  ON public.asset_insurance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view asset financials"
  ON public.asset_financials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view asset lifecycle events"
  ON public.asset_lifecycle_events FOR SELECT TO authenticated USING (true);

-- Authenticated users can INSERT/UPDATE/DELETE satellite data
CREATE POLICY "Authenticated users can insert asset documents"
  ON public.asset_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update asset documents"
  ON public.asset_documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete asset documents"
  ON public.asset_documents FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert asset insurance"
  ON public.asset_insurance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update asset insurance"
  ON public.asset_insurance FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete asset insurance"
  ON public.asset_insurance FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert asset financials"
  ON public.asset_financials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update asset financials"
  ON public.asset_financials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete asset financials"
  ON public.asset_financials FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert asset lifecycle events"
  ON public.asset_lifecycle_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update asset lifecycle events"
  ON public.asset_lifecycle_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete asset lifecycle events"
  ON public.asset_lifecycle_events FOR DELETE TO authenticated USING (true);

-- ── Triggers for updated_at ──

CREATE TRIGGER update_asset_documents_updated_at
  BEFORE UPDATE ON public.asset_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_insurance_updated_at
  BEFORE UPDATE ON public.asset_insurance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
