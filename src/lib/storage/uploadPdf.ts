import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'asset-protection-docs' as const;

export type PdfFolder = 'insurance' | 'warranty' | 'documents';

export interface PdfUploadResult {
  storagePath: string;
  size: number;
  documentName: string;
}

export async function uploadPdf(
  file: File,
  assetId: string,
  folder: PdfFolder,
  signal?: AbortSignal,
): Promise<PdfUploadResult> {
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF allowed');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File exceeds 10MB limit');
  }

  const path = `${folder}/${assetId}/${crypto.randomUUID()}.pdf`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/pdf',
    });

  if (signal?.aborted) throw new DOMException('Upload aborted', 'AbortError');
  if (error) throw error;

  return { storagePath: path, size: file.size, documentName: file.name };
}
