import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'asset-protection-docs' as const;
const TTL = 3600; // 1 hour

const cache = new Map<string, { url: string; expires: number }>();

export async function getSignedPdf(path: string): Promise<string> {
  const cached = cache.get(path);
  if (cached && cached.expires > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, TTL);

  if (error || !data?.signedUrl) {
    throw error ?? new Error('Failed to create signed URL');
  }

  cache.set(path, {
    url: data.signedUrl,
    expires: Date.now() + (TTL - 60) * 1000,
  });

  return data.signedUrl;
}

export async function deletePdf(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);
  if (error) throw error;
  cache.delete(path);
}
