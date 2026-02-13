import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRBAC } from '@/hooks/useRBAC';
import { toast } from 'sonner';

export type WorkOrderStatus = 'Open' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
export type WorkOrderPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type WorkOrderType = 'Preventive' | 'Corrective' | 'Inspection' | 'Warranty' | 'Emergency';

export interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  description: string | null;
  asset_id: string | null;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  work_order_type: WorkOrderType | null;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  estimated_cost: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  asset?: {
    id: string;
    asset_name: string;
    asset_code: string;
    location: string;
  } | null;
  assignee?: {
    name: string;
    email: string;
  } | null;
}

export interface WorkOrderInsert {
  title: string;
  description?: string;
  asset_id?: string | null;
  priority?: WorkOrderPriority;
  status?: WorkOrderStatus;
  work_order_type?: WorkOrderType;
  assigned_to?: string | null;
  due_date?: string | null;
  estimated_cost?: number | null;
}

export interface WorkOrderUpdate {
  title?: string;
  description?: string;
  asset_id?: string | null;
  priority?: WorkOrderPriority;
  status?: WorkOrderStatus;
  work_order_type?: WorkOrderType;
  assigned_to?: string | null;
  due_date?: string | null;
  estimated_cost?: number | null;
  completed_at?: string | null;
}

export function useWorkOrders() {
  return useQuery({
    queryKey: ['work_orders'],
    queryFn: async () => {
      // Using type assertion as the types file may not have updated yet
      const { data, error } = await (supabase
        .from('work_orders' as 'assets')
        .select(`
          *,
          asset:assets(id, asset_name, asset_code, location),
          assignee:profiles!work_orders_assigned_to_fkey(name, email)
        `)
        .order('created_at', { ascending: false }) as unknown as Promise<{ data: WorkOrder[] | null; error: Error | null }>);

      if (error) throw error;
      return (data || []) as WorkOrder[];
    },
  });
}

export function useWorkOrder(id: string | null) {
  return useQuery({
    queryKey: ['work_orders', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase
        .from('work_orders' as 'assets')
        .select(`
          *,
          asset:assets(id, asset_name, asset_code, location),
          assignee:profiles!work_orders_assigned_to_fkey(name, email)
        `)
        .eq('id', id)
        .maybeSingle() as unknown as Promise<{ data: WorkOrder | null; error: Error | null }>);

      if (error) throw error;
      return data as WorkOrder | null;
    },
    enabled: !!id,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  const { isAuthenticated, handleRLSError } = useRBAC();

  return useMutation({
    mutationFn: async (workOrder: WorkOrderInsert) => {
      // Frontend auth check - both admin and user can create work orders
      if (!isAuthenticated) {
        throw new Error('Authentication required to create work orders');
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const insertData = {
        title: workOrder.title,
        description: workOrder.description || null,
        asset_id: workOrder.asset_id || null,
        priority: workOrder.priority || 'Medium',
        status: workOrder.status || 'Open',
        work_order_type: workOrder.work_order_type || 'Corrective',
        assigned_to: workOrder.assigned_to || null,
        due_date: workOrder.due_date || null,
        estimated_cost: workOrder.estimated_cost || null,
        created_by: userData.user.id,
      };

      const { data, error } = await (supabase
        .from('work_orders' as 'assets')
        .insert(insertData as never)
        .select()
        .single() as unknown as Promise<{ data: WorkOrder | null; error: Error | null }>);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      toast.success('Work order created successfully');
    },
    onError: (error: Error) => {
      toast.error(handleRLSError(error));
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();
  const { handleRLSError } = useRBAC();

  return useMutation({
    mutationFn: async ({ id, ...updates }: WorkOrderUpdate & { id: string }) => {
      // If status is being changed to Completed, set completed_at
      const updateData = { ...updates };
      if (updates.status === 'Completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await (supabase
        .from('work_orders' as 'assets')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single() as unknown as Promise<{ data: WorkOrder | null; error: Error | null }>);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      toast.success('Work order updated successfully');
    },
    onError: (error: Error) => {
      toast.error(handleRLSError(error));
    },
  });
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();
  const { isAuthenticated, handleRLSError } = useRBAC();

  return useMutation({
    mutationFn: async (id: string) => {
      // Frontend auth check - both admin and user can delete work orders
      if (!isAuthenticated) {
        throw new Error('Authentication required to delete work orders');
      }

      const { error } = await (supabase
        .from('work_orders' as 'assets')
        .delete()
        .eq('id', id) as unknown as Promise<{ error: Error | null }>);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      toast.success('Work order deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(handleRLSError(error));
    },
  });
}

export function useAssignableUsers() {
  return useQuery({
    queryKey: ['assignable_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });
}
