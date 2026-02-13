import { useState } from 'react';
import TopNav from '@/components/TopNav';
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset, Asset, AssetInsert } from '@/hooks/useAssets';
import { exportAssetsCSV } from '@/lib/export';
import AssetTable from '@/components/assets/AssetTable';
import AssetFormModal from '@/components/assets/AssetFormModal';
import AssetViewModal from '@/components/assets/AssetViewModal';
import DeleteAssetDialog from '@/components/assets/DeleteAssetDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, Plus, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssetMaster() {
  
  const { data: assets, isLoading, error } = useAssets();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const [searchQuery, setSearchQuery] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const filteredAssets = assets?.filter((asset) => {
    const query = searchQuery.toLowerCase();
    return (
      asset.asset_name.toLowerCase().includes(query) ||
      asset.asset_code.toLowerCase().includes(query) ||
      asset.serial_number?.toLowerCase().includes(query) ||
      asset.location.toLowerCase().includes(query) ||
      asset.custodian?.toLowerCase().includes(query)
    );
  }) || [];

  const handleAddNew = () => {
    setSelectedAsset(null);
    setIsEditing(false);
    setFormModalOpen(true);
  };

  const handleView = (asset: Asset) => {
    setSelectedAsset(asset);
    setViewModalOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsEditing(true);
    setFormModalOpen(true);
  };

  const handleDelete = (asset: Asset) => {
    setSelectedAsset(asset);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: AssetInsert) => {
    if (isEditing && selectedAsset) {
      await updateAsset.mutateAsync({ id: selectedAsset.id, ...data });
    } else {
      await createAsset.mutateAsync(data);
    }
    setFormModalOpen(false);
    setSelectedAsset(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAsset) {
      return;
    }
    
    await deleteAsset.mutateAsync(selectedAsset.id);
    setDeleteDialogOpen(false);
    setSelectedAsset(null);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await exportAssetsCSV();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container py-8 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Asset Master</h1>
            <p className="text-muted-foreground mt-1">Comprehensive view of all company assets</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleExportCSV}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export CSV
            </Button>
            <Button onClick={handleAddNew} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load assets. Please try again.</p>
          </div>
        ) : (
          <AssetTable
            assets={filteredAssets}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Modals */}
        <AssetFormModal
          open={formModalOpen}
          onOpenChange={setFormModalOpen}
          asset={isEditing ? selectedAsset : null}
          onSubmit={handleFormSubmit}
          isLoading={createAsset.isPending || updateAsset.isPending}
        />

        <AssetViewModal
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          asset={selectedAsset}
        />

        <DeleteAssetDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          asset={selectedAsset}
          onConfirm={handleConfirmDelete}
          isLoading={deleteAsset.isPending}
        />
      </main>
    </div>
  );
}
