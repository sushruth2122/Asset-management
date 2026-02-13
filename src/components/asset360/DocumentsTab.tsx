import { memo, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { FileText, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAssetDocuments, useCreateAssetDocument, useDeleteAssetDocument, type DocumentType } from '@/hooks/useAsset360';
import FileUploader from '@/components/shared/FileUploader';
import SignedUrlPreviewModal from '@/components/shared/SignedUrlPreviewModal';
import type { UploadResult } from '@/lib/storage';

interface Props {
  assetId: string;
}

const docTypeBadge: Record<string, string> = {
  manual: 'bg-blue-500/20 text-blue-400',
  warranty: 'bg-emerald-500/20 text-emerald-400',
  certificate: 'bg-purple-500/20 text-purple-400',
  inspection: 'bg-amber-500/20 text-amber-400',
  compliance: 'bg-red-500/20 text-red-400',
  general: 'bg-slate-500/20 text-slate-400',
};

const DOC_TYPES: DocumentType[] = ['manual', 'warranty', 'certificate', 'inspection', 'compliance', 'general'];

function formatBytes(bytes: number | null) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentsTab({ assetId }: Props) {
  const { data: docs, isLoading } = useAssetDocuments(assetId);
  const createDoc = useCreateAssetDocument();
  const deleteDoc = useDeleteAssetDocument();

  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<DocumentType>('general');
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const handleUploaded = useCallback((result: UploadResult) => {
    createDoc.mutate({
      asset_id: assetId,
      document_name: docName || 'Untitled Document',
      name: docName || 'Untitled Document',
      document_type: docType,
      file_url: result.storagePath,
      file_size_bytes: result.size,
      uploaded_by: null,
      notes: null,
    });
    setDocName('');
    setDocType('general');
  }, [assetId, createDoc, docName, docType]);

  const openPreview = useCallback((storagePath: string, name: string) => {
    setPreviewPath(storagePath);
    setPreviewTitle(name);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Document name"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
            />
            <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FileUploader
            folder="documents"
            assetId={assetId}
            onUploaded={handleUploaded}
          />
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents ({docs?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!docs?.length ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No documents attached to this asset.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.document_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={docTypeBadge[doc.document_type] ?? ''}>
                        {doc.document_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatBytes(doc.file_size_bytes)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {format(new Date(doc.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {doc.file_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openPreview(doc.file_url!, doc.document_name)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteDoc.mutate({ id: doc.id, asset_id: assetId })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SignedUrlPreviewModal
        open={!!previewPath}
        onOpenChange={(open) => { if (!open) setPreviewPath(null); }}
        storagePath={previewPath}
        title={previewTitle}
      />
    </div>
  );
}

export default memo(DocumentsTab);
