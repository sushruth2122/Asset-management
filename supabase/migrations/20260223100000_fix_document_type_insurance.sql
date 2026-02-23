-- Fix: Add 'insurance' to asset_documents.document_type CHECK constraint
ALTER TABLE public.asset_documents DROP CONSTRAINT IF EXISTS asset_documents_document_type_check;
ALTER TABLE public.asset_documents ADD CONSTRAINT asset_documents_document_type_check
  CHECK (document_type IN ('manual', 'warranty', 'certificate', 'inspection', 'compliance', 'insurance', 'general'));
