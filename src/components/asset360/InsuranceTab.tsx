import { memo, useState, useCallback } from 'react';
import { format, isPast, differenceInDays } from 'date-fns';
import { Shield, AlertTriangle, CheckCircle, Eye, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssetInsurance, useUpdateAssetInsurance } from '@/hooks/useAsset360';
import FileUploader from '@/components/shared/FileUploader';
import SignedUrlPreviewModal from '@/components/shared/SignedUrlPreviewModal';
import type { UploadResult } from '@/lib/storage';

interface Props {
  assetId: string;
}

function InsuranceTab({ assetId }: Props) {
  const { data: policies, isLoading } = useAssetInsurance(assetId);
  const updateInsurance = useUpdateAssetInsurance();

  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [uploadingPolicyId, setUploadingPolicyId] = useState<string | null>(null);

  const handlePolicyUpload = useCallback((policyId: string, result: UploadResult) => {
    updateInsurance.mutate({
      id: policyId,
      asset_id: assetId,
      storage_path: result.storagePath,
      document_name: result.documentName,
      uploaded_at: new Date().toISOString(),
    });
    setUploadingPolicyId(null);
  }, [assetId, updateInsurance]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  if (!policies?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No insurance records found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {policies.map((p) => {
          const expired = isPast(new Date(p.end_date));
          const daysToExpiry = differenceInDays(new Date(p.end_date), new Date());
          const urgent = !expired && daysToExpiry <= 30;

          return (
            <Card key={p.id} className={expired ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.provider}</CardTitle>
                  {expired ? (
                    <Badge variant="destructive">Expired</Badge>
                  ) : urgent ? (
                    <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Expires in {daysToExpiry}d
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
                    <dt className="text-muted-foreground text-xs">Policy Number</dt>
                    <dd className="font-mono">{p.policy_number}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Coverage</dt>
                    <dd>{p.coverage_type}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Premium</dt>
                    <dd className="font-medium">${p.premium_amount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Coverage Amount</dt>
                    <dd className="font-medium">${p.coverage_amount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Start</dt>
                    <dd>{format(new Date(p.start_date), 'dd MMM yyyy')}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">End</dt>
                    <dd>{format(new Date(p.end_date), 'dd MMM yyyy')}</dd>
                  </div>
                </dl>

                {/* Policy Document Actions */}
                <div className="border-t pt-3">
                  {p.storage_path ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewPath(p.storage_path!);
                        setPreviewTitle(`${p.provider} - ${p.policy_number}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Policy
                    </Button>
                  ) : uploadingPolicyId === p.id ? (
                    <FileUploader
                      folder="insurance"
                      assetId={assetId}
                      onUploaded={(result) => handlePolicyUpload(p.id, result)}
                    />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadingPolicyId(p.id)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Attach Policy PDF
                    </Button>
                  )}
                </div>

                {p.notes && (
                  <p className="text-xs text-muted-foreground border-t pt-2">{p.notes}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <SignedUrlPreviewModal
        open={!!previewPath}
        onOpenChange={(open) => { if (!open) setPreviewPath(null); }}
        storagePath={previewPath}
        title={previewTitle}
      />
    </div>
  );
}

export default memo(InsuranceTab);
