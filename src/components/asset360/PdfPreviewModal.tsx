import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
}

export default function PdfPreviewModal({ open, onOpenChange, url, title }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title ?? 'Document Preview'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <iframe
            src={url}
            title={title ?? 'PDF Preview'}
            className="w-full h-full rounded-md border border-border"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
