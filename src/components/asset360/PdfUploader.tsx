import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, X, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { validatePdf, MAX_FILE_SIZE, uploadAssetDocument, type UploadResult } from '@/lib/storage';

interface Props {
  bucket: 'asset-documents' | 'asset-insurance';
  assetId: string;
  subFolder: string;
  onUploaded: (result: UploadResult) => void;
  disabled?: boolean;
}

export default function PdfUploader({ bucket, assetId, subFolder, onUploaded, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validatePdf(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const doUpload = useCallback(async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(10);
    setError(null);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        setProgress(30 + attempts * 10);
        const result = await uploadAssetDocument(bucket, assetId, subFolder, selectedFile);
        setProgress(100);
        setSelectedFile(null);
        if (inputRef.current) inputRef.current.value = '';
        onUploaded(result);
        setUploading(false);
        return;
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) {
          setError(err instanceof Error ? err.message : 'Upload failed after retries.');
          setUploading(false);
          setProgress(0);
        }
      }
    }
  }, [selectedFile, bucket, assetId, subFolder, onUploaded]);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose PDF
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        {selectedFile && !uploading && (
          <>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
            </span>
            <Button size="sm" onClick={doUpload}>
              Upload
            </Button>
            <Button size="icon" variant="ghost" onClick={reset}>
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {uploading && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">Uploading... {progress}%</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={doUpload} className="ml-auto">
            <RotateCcw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        PDF only. Max {MAX_FILE_SIZE / (1024 * 1024)}MB.
      </p>
    </div>
  );
}
