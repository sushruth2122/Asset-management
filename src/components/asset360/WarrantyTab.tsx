import { memo, useState, useCallback } from 'react';
import { format, isPast, differenceInDays } from 'date-fns';
import { ShieldCheck, AlertTriangle, CheckCircle, Eye, Upload, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAssetWarranties, useCreateAssetWarranty, useUpdateAssetWarranty } from '@/hooks/useAsset360';
import FileUploader from '@/components/shared/FileUploader';
import SignedUrlPreviewModal from '@/components/shared/SignedUrlPreviewModal';
import type { UploadResult } from '@/lib/storage';

interface Props {
  assetId: string;
}

function WarrantyTab({ assetId }: Props) {
  const { data: warranties, isLoading } = useAssetWarranties(assetId);
  const createWarranty = useCreateAssetWarranty();
  const updateWarranty = useUpdateAssetWarranty();

  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [uploadingWarrantyId, setUploadingWarrantyId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Form state
  const [formProvider, setFormProvider] = useState('');
  const [formType, setFormType] = useState('standard');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formTerms, setFormTerms] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const resetForm = useCallback(() => {
    setFormProvider('');
    setFormType('standard');
    setFormStart('');
    setFormEnd('');
    setFormTerms('');
    setFormNotes('');
  }, []);

  const handleAdd = useCallback(async () => {
    if (!formProvider || !formStart || !formEnd) return;
    await createWarranty.mutateAsync({
      asset_id: assetId,
      provider: formProvider,
      warranty_type: formType,
      start_date: formStart,
      end_date: formEnd,
      terms: formTerms || null,
      document_url: null,
      storage_path: null,
      notes: formNotes || null,
    });
    resetForm();
    setAddOpen(false);
  }, [assetId, formProvider, formType, formStart, formEnd, formTerms, formNotes, createWarranty, resetForm]);

  const handleWarrantyUpload = useCallback((warrantyId: string, result: UploadResult) => {
    updateWarranty.mutate({
      id: warrantyId,
      asset_id: assetId,
      storage_path: result.storagePath,
    });
    setUploadingWarrantyId(null);
  }, [assetId, updateWarranty]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Warranties</h3>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Warranty
        </Button>
      </div>

      {!warranties?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No warranty records found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {warranties.map((w) => {
            const expired = isPast(new Date(w.end_date));
            const daysToExpiry = differenceInDays(new Date(w.end_date), new Date());
            const urgent = !expired && daysToExpiry <= 30;

            return (
              <Card key={w.id} className={expired ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{w.provider}</CardTitle>
                    {expired ? (
                      <Badge variant="destructive">Expired</Badge>
                    ) : urgent ? (
                      <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        <AlertTriangle className="h-3 w-3 mr-1" /> {daysToExpiry}d left
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground text-xs">Type</dt>
                      <dd className="capitalize">{w.warranty_type}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Period</dt>
                      <dd>{format(new Date(w.start_date), 'dd MMM yyyy')} – {format(new Date(w.end_date), 'dd MMM yyyy')}</dd>
                    </div>
                  </dl>

                  {w.terms && (
                    <p className="text-xs text-muted-foreground">{w.terms}</p>
                  )}

                  <div className="border-t pt-3">
                    {w.storage_path ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreviewPath(w.storage_path!);
                          setPreviewTitle(`${w.provider} Warranty`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Warranty
                      </Button>
                    ) : uploadingWarrantyId === w.id ? (
                      <FileUploader
                        folder="warranty"
                        assetId={assetId}
                        onUploaded={(result) => handleWarrantyUpload(w.id, result)}
                      />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadingWarrantyId(w.id)}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Attach Warranty PDF
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Warranty Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Warranty</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Provider *</Label>
              <Input value={formProvider} onChange={(e) => setFormProvider(e.target.value)} placeholder="Manufacturer / vendor" />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Input value={formType} onChange={(e) => setFormType(e.target.value)} placeholder="standard, extended, etc." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date *</Label>
                <Input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>End Date *</Label>
                <Input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Terms</Label>
              <Textarea value={formTerms} onChange={(e) => setFormTerms(e.target.value)} rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!formProvider || !formStart || !formEnd || createWarranty.isPending}>
              {createWarranty.isPending ? 'Adding…' : 'Add Warranty'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signed URL Preview */}
      <SignedUrlPreviewModal
        open={!!previewPath}
        onOpenChange={(open) => { if (!open) setPreviewPath(null); }}
        storagePath={previewPath}
        title={previewTitle}
      />
    </div>
  );
}

export default memo(WarrantyTab);
