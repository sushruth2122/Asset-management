-- ══════════════════════════════════════════════════════════════════════════════
-- Create the `asset-protection-docs` storage bucket used by the application
-- for insurance, warranty, and general document uploads.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Create the private bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-protection-docs', 'asset-protection-docs', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies — allow authenticated users full access
CREATE POLICY "Authenticated users can upload docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'asset-protection-docs');

CREATE POLICY "Authenticated users can read docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'asset-protection-docs');

CREATE POLICY "Authenticated users can update docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'asset-protection-docs')
  WITH CHECK (bucket_id = 'asset-protection-docs');

CREATE POLICY "Authenticated users can delete docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'asset-protection-docs');
