import { useState, useMemo } from 'react';
import { Plus, Search, LayoutGrid, List, BarChart3 } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useWorkOrders,
  useUpdateWorkOrder,
  type WorkOrder,
  type WorkOrderStatus,
  type WorkOrderPriority,
  type WorkOrderType,
} from '@/hooks/useWorkOrders';
import { useAssets } from '@/hooks/useAssets';
import WorkOrderKanban from '@/components/work-orders/WorkOrderKanban';
import WorkOrderListView from '@/components/work-orders/WorkOrderListView';
import WorkOrderFormModal from '@/components/work-orders/WorkOrderFormModal';
import WorkOrderViewModal from '@/components/work-orders/WorkOrderViewModal';
import DeleteWorkOrderDialog from '@/components/work-orders/DeleteWorkOrderDialog';
import WorkOrderReportsModal from '@/components/work-orders/WorkOrderReportsModal';

const ALL_STATUSES: WorkOrderStatus[] = ['Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
const ALL_TYPES: WorkOrderType[] = ['Preventive', 'Corrective', 'Inspection', 'Warranty', 'Emergency'];
const ALL_PRIORITIES: WorkOrderPriority[] = ['Low', 'Medium', 'High', 'Critical'];

export default function WorkOrders() {
  const { data: workOrders, isLoading } = useWorkOrders();
  const { data: assets } = useAssets();
  const updateMutation = useUpdateWorkOrder();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<WorkOrderPriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<WorkOrderType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  // Filter work orders
  const filteredWorkOrders = useMemo(() => {
    if (!workOrders) return [];

    return workOrders.filter((wo) => {
      const matchesSearch =
        searchQuery === '' ||
        wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.work_order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || wo.priority === priorityFilter;
      const matchesType = typeFilter === 'all' || wo.work_order_type === typeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [workOrders, searchQuery, statusFilter, priorityFilter, typeFilter]);

  // Count by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Pending': 0,
      'In Progress': 0,
      'Completed': 0,
    };
    workOrders?.forEach((wo) => {
      if (wo.status === 'Open' || wo.status === 'On Hold') {
        counts['Pending']++;
      } else if (wo.status === 'In Progress') {
        counts['In Progress']++;
      } else if (wo.status === 'Completed') {
        counts['Completed']++;
      }
    });
    return counts;
  }, [workOrders]);

  const visibleStatuses = useMemo(() => {
    if (statusFilter === 'all') {
      return ['Open', 'In Progress', 'Completed'] as WorkOrderStatus[];
    }
    return [statusFilter];
  }, [statusFilter]);

  const handleViewDetails = (wo: WorkOrder) => {
    setSelectedWorkOrder(wo);
    setIsViewOpen(true);
  };

  const handleStartWork = async (wo: WorkOrder) => {
    await updateMutation.mutateAsync({ id: wo.id, status: 'In Progress' });
  };

  const handleComplete = async (wo: WorkOrder) => {
    await updateMutation.mutateAsync({ id: wo.id, status: 'Completed' });
  };

  const handleEdit = (wo: WorkOrder) => {
    setSelectedWorkOrder(wo);
    setIsViewOpen(false);
    setIsFormOpen(true);
  };

  const handleDelete = (wo: WorkOrder) => {
    setSelectedWorkOrder(wo);
    setIsViewOpen(false);
    setIsDeleteOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedWorkOrder(null);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Work Order Management</h1>
            <p className="text-muted-foreground">
              Track maintenance, repairs, and inspections for your assets
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsReportsOpen(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Work Order
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search work orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as WorkOrderType | 'all')}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Types</SelectItem>
                {ALL_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as WorkOrderPriority | 'all')}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Priorities</SelectItem>
                {ALL_PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status tabs + View Toggle */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('all')}
            >
              Pending {statusCounts['Pending']}
            </Badge>
            <Badge
              variant={statusFilter === 'In Progress' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('In Progress')}
            >
              In Progress {statusCounts['In Progress']}
            </Badge>
            <Badge
              variant={statusFilter === 'Completed' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setStatusFilter('Completed')}
            >
              Completed {statusCounts['Completed']}
            </Badge>
          </div>

          <div className="ml-auto">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'list')}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="kanban">
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Kanban Board
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-1" />
                  List View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ))}
          </div>
        ) : filteredWorkOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <LayoutGrid className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No work orders found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first work order'}
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Work Order
            </Button>
          </div>
        ) : viewMode === 'kanban' ? (
          <WorkOrderKanban
            workOrders={filteredWorkOrders}
            onViewDetails={handleViewDetails}
            onStartWork={handleStartWork}
            onComplete={handleComplete}
            visibleStatuses={visibleStatuses}
          />
        ) : (
          <WorkOrderListView
            workOrders={filteredWorkOrders}
            onViewDetails={handleViewDetails}
            onStartWork={handleStartWork}
            onComplete={handleComplete}
          />
        )}

        {/* Modals */}
        <WorkOrderFormModal
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          workOrder={selectedWorkOrder}
        />

        <WorkOrderViewModal
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          workOrder={selectedWorkOrder}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <DeleteWorkOrderDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          workOrder={selectedWorkOrder}
        />

        <WorkOrderReportsModal
          open={isReportsOpen}
          onOpenChange={setIsReportsOpen}
          workOrders={workOrders || []}
        />
      </main>
    </div>
  );
}
