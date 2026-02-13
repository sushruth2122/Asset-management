import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, X, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  validatePdf,
  MAX_FILE_SIZE,
  uploadProtectionDoc,
  type DocFolder,
  type UploadResult,
} from '@/lib/storage';

interface Props {
  folder: DocFolder;
  assetId: string;
  onUploaded: (result: UploadResult) => void;
  disabled?: boolean;
}

export default function FileUploader({ folder, assetId, onUploaded, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = useCallback((file: File) => {
    const validationError = validatePdf(file);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) pickFile(file);
    },
    [pickFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) pickFile(file);
    },
    [pickFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const doUpload = useCallback(async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(10);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        setProgress(20 + attempts * 20);
        const result = await uploadProtectionDoc(folder, assetId, selectedFile, controller.signal);
        setProgress(100);
        setSelectedFile(null);
        if (inputRef.current) inputRef.current.value = '';
        onUploaded(result);
        toast.success('File uploaded successfully');
        setUploading(false);
        abortRef.current = null;
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setError('Upload cancelled');
          setUploading(false);
          setProgress(0);
          abortRef.current = null;
          return;
        }
        attempts++;
        if (attempts >= maxAttempts) {
          const msg = err instanceof Error ? err.message : 'Upload failed after 3 attempts.';
          setError(msg);
          toast.error(msg);
          setUploading(false);
          setProgress(0);
          abortRef.current = null;
        }
      }
    }
  }, [selectedFile, folder, assetId, onUploaded]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setSelectedFile(null);
    setError(null);
    setProgress(0);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer
          ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'}
          ${disabled || uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop a PDF here, or <span className="text-primary underline">browse</span>
        </p>
        <p className="text-xs text-muted-foreground">PDF only · Max {MAX_FILE_SIZE / (1024 * 1024)}MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Selected file */}
      {selectedFile && !uploading && (
        <div className="flex items-center gap-3 rounded-md border border-border p-3">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(0)} KB</p>
          </div>
          <Button size="sm" onClick={doUpload}>
            Upload
          </Button>
          <Button size="icon" variant="ghost" onClick={cancel} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm">Uploading… {progress}%</span>
            <Button size="sm" variant="ghost" onClick={cancel} className="ml-auto h-7">
              Cancel
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive rounded-md border border-destructive/30 p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button size="sm" variant="ghost" onClick={doUpload} className="h-7">
            <RotateCcw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </div>
      )}
    </div>
  );
}
