import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSignedUrl } from '@/lib/storage';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storagePath: string | null;
  title?: string;
}

export default function SignedUrlPreviewModal({ open, onOpenChange, storagePath, title }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !storagePath) {
      setSignedUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getSignedUrl(storagePath)
      .then((url) => {
        if (!cancelled) {
          setSignedUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load document');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, storagePath]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title ?? 'Document Preview'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          {loading && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}
          {error && <p className="text-destructive text-sm">{error}</p>}
          {signedUrl && !loading && (
            <iframe
              src={signedUrl}
              title={title ?? 'PDF Preview'}
              className="w-full h-full rounded-md border border-border"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
