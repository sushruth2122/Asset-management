import { useState } from 'react';
import TopNav from '@/components/TopNav';
import { 
  useSpareParts, 
  useCreateSparePart, 
  useUpdateSparePart, 
  useDeleteSparePart,
  useSparePartsStats,
  SparePart, 
  SparePartInsert 
} from '@/hooks/useSpareParts';
import { exportSparePartsCSV } from '@/lib/export';
import SparePartsTable from '@/components/spare-parts/SparePartsTable';
import SparePartFormModal from '@/components/spare-parts/SparePartFormModal';
import SparePartViewModal from '@/components/spare-parts/SparePartViewModal';
import DeleteSparePartDialog from '@/components/spare-parts/DeleteSparePartDialog';
import InventoryAlert from '@/components/spare-parts/InventoryAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Cog, TrendingDown, Download, DollarSign, QrCode, BarChart3, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SpareParts() {
  
  const { data: parts, isLoading, error } = useSpareParts();
  const createPart = useCreateSparePart();
  const updatePart = useUpdateSparePart();
  const deletePart = useDeleteSparePart();
  const stats = useSparePartsStats(parts);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const filteredParts = parts?.filter((part) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      part.part_name.toLowerCase().includes(query) ||
      part.part_number.toLowerCase().includes(query) ||
      part.supplier?.toLowerCase().includes(query) ||
      part.storage_location?.toLowerCase().includes(query)
    );

    if (statusFilter === 'all') return matchesSearch;
    
    const stockStatus = part.quantity === 0 ? 'out' : 
                       part.quantity <= part.minimum_threshold ? 'low' : 'in';
    return matchesSearch && stockStatus === statusFilter;
  }) || [];

  const handleAddNew = () => {
    setSelectedPart(null);
    setIsEditing(false);
    setFormModalOpen(true);
  };

  const handleView = (part: SparePart) => {
    setSelectedPart(part);
    setViewModalOpen(true);
  };

  const handleEdit = (part: SparePart) => {
    setSelectedPart(part);
    setIsEditing(true);
    setFormModalOpen(true);
  };

  const handleDelete = (part: SparePart) => {
    setSelectedPart(part);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: SparePartInsert) => {
    if (isEditing && selectedPart) {
      await updatePart.mutateAsync({ id: selectedPart.id, ...data });
    } else {
      await createPart.mutateAsync(data);
    }
    setFormModalOpen(false);
    setSelectedPart(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPart) {
      return;
    }
    
    await deletePart.mutateAsync(selectedPart.id);
    setDeleteDialogOpen(false);
    setSelectedPart(null);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await exportSparePartsCSV();
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
            <h1 className="text-3xl font-bold text-foreground">Spare Parts Inventory</h1>
            <p className="text-muted-foreground mt-1">Track, manage, and reorder spare parts for your assets</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <QrCode className="h-4 w-4" />
              Scan Code
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
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Reports
            </Button>
            <Button onClick={handleAddNew} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Part
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Cog className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Parts</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalParts}</p>
                  <p className="text-xs text-muted-foreground">Across all categories</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <TrendingDown className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-foreground">{stats.lowStockParts}</p>
                  <p className="text-xs text-muted-foreground">Parts below threshold</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Download className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold text-foreground">{stats.outOfStockParts}</p>
                  <p className="text-xs text-muted-foreground">Need reordering</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inventory Value</p>
                  <p className="text-2xl font-bold text-foreground">${stats.totalValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total on-hand value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Alert */}
        {showAlert && (
          <InventoryAlert 
            outOfStock={stats.outOfStockParts} 
            lowStock={stats.lowStockParts}
            onDismiss={() => setShowAlert(false)}
          />
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parts by name, number, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
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
            <p className="text-destructive">Failed to load spare parts. Please try again.</p>
          </div>
        ) : (
          <SparePartsTable
            parts={filteredParts}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Modals */}
        <SparePartFormModal
          open={formModalOpen}
          onOpenChange={setFormModalOpen}
          part={isEditing ? selectedPart : null}
          onSubmit={handleFormSubmit}
          isLoading={createPart.isPending || updatePart.isPending}
        />

        <SparePartViewModal
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          part={selectedPart}
        />

        <DeleteSparePartDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          part={selectedPart}
          onConfirm={handleConfirmDelete}
          isLoading={deletePart.isPending}
        />
      </main>
    </div>
  );
}
