import { supabase } from '@/integrations/supabase/client';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const SIGNED_URL_TTL = 3600; // 1 hour

export type ProtectionBucket = 'asset-protection-docs';
export type DocFolder = 'insurance' | 'warranty' | 'documents';

export interface UploadResult {
  storagePath: string;
  size: number;
}

function validatePdf(file: File): string | null {
  if (file.type !== 'application/pdf') return 'Only PDF files are accepted.';
  if (file.size > MAX_FILE_SIZE) return `File exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`;
  return null;
}

/**
 * Upload a PDF to asset-protection-docs bucket.
 * Path: {folder}/{assetId}/{uuid}.pdf — never uses original filenames.
 */
export async function uploadProtectionDoc(
  folder: DocFolder,
  assetId: string,
  file: File,
  signal?: AbortSignal,
): Promise<UploadResult> {
  const err = validatePdf(file);
  if (err) throw new Error(err);

  const storagePath = `${folder}/${assetId}/${crypto.randomUUID()}.pdf`;

  const { error } = await supabase.storage
    .from('asset-protection-docs')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/pdf',
      ...(signal ? {} : {}),
    });

  if (signal?.aborted) throw new DOMException('Upload aborted', 'AbortError');
  if (error) throw error;

  return { storagePath, size: file.size };
}

/**
 * Generate a signed URL (1 hour TTL).
 * Cached per session via a module-level Map.
 */
const signedUrlCache = new Map<string, { url: string; expires: number }>();

export async function getSignedUrl(storagePath: string): Promise<string> {
  const cached = signedUrlCache.get(storagePath);
  if (cached && cached.expires > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from('asset-protection-docs')
    .createSignedUrl(storagePath, SIGNED_URL_TTL);

  if (error || !data?.signedUrl) throw error ?? new Error('Failed to create signed URL');

  signedUrlCache.set(storagePath, {
    url: data.signedUrl,
    expires: Date.now() + (SIGNED_URL_TTL - 60) * 1000, // refresh 1 min early
  });

  return data.signedUrl;
}

export async function deleteProtectionDoc(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('asset-protection-docs')
    .remove([storagePath]);
  if (error) throw error;
  signedUrlCache.delete(storagePath);
}

export { validatePdf, MAX_FILE_SIZE };
