import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRBAC } from './useRBAC';

export interface SparePart {
  id: string;
  part_name: string;
  part_number: string;
  quantity: number;
  asset_id: string | null;
  description: string;
  supplier: string;
  storage_location: string;
  minimum_threshold: number;
  reorder_quantity: number;
  unit_cost: number;
  warranty_days: number;
  status: string;
  created_at: string;
  updated_at: string;
  asset?: {
    id: string;
    asset_name: string;
    asset_code: string;
  } | null;
}

export type SparePartInsert = Omit<SparePart, 'id' | 'created_at' | 'updated_at' | 'asset'>;
export type SparePartUpdate = Partial<SparePartInsert>;

export function useSpareParts() {
  return useQuery({
    queryKey: ['spare-parts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spare_parts')
        .select(`
          *,
          asset:assets(id, asset_name, asset_code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SparePart[];
    },
  });
}

export function useSparePart(id: string | null) {
  return useQuery({
    queryKey: ['spare-parts', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('spare_parts')
        .select(`
          *,
          asset:assets(id, asset_name, asset_code)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as SparePart | null;
    },
    enabled: !!id,
  });
}

export function useCreateSparePart() {
  const queryClient = useQueryClient();
  const { isAuthenticated, handleRLSError } = useRBAC();

  return useMutation({
    mutationFn: async (part: SparePartInsert) => {
      // Frontend auth check - both admin and user can create
      if (!isAuthenticated) {
        throw new Error('Authentication required to create spare parts');
      }

      const { data, error } = await supabase
        .from('spare_parts')
        .insert(part)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      toast.success('Spare part created successfully');
    },
    onError: (error: Error) => {
      const message = handleRLSError(error);
      toast.error(`Failed to create spare part: ${message}`);
    },
  });
}

export function useUpdateSparePart() {
  const queryClient = useQueryClient();
  const { isAuthenticated, handleRLSError } = useRBAC();

  return useMutation({
    mutationFn: async ({ id, ...updates }: SparePartUpdate & { id: string }) => {
      // Frontend auth check - both admin and user can update
      if (!isAuthenticated) {
        throw new Error('Authentication required to update spare parts');
      }

      const { data, error } = await supabase
        .from('spare_parts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      toast.success('Spare part updated successfully');
    },
    onError: (error: Error) => {
      const message = handleRLSError(error);
      toast.error(`Failed to update spare part: ${message}`);
    },
  });
}

export function useDeleteSparePart() {
  const queryClient = useQueryClient();
  const { isAuthenticated, handleRLSError } = useRBAC();

  return useMutation({
    mutationFn: async (id: string) => {
      // Frontend auth check - both admin and user can delete
      if (!isAuthenticated) {
        throw new Error('Authentication required to delete spare parts');
      }

      const { error } = await supabase
        .from('spare_parts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      toast.success('Spare part deleted successfully');
    },
    onError: (error: Error) => {
      const message = handleRLSError(error);
      toast.error(`Failed to delete spare part: ${message}`);
    },
  });
}

export function useSparePartsStats(parts: SparePart[] | undefined) {
  const totalParts = parts?.length || 0;
  const lowStockParts = parts?.filter(p => p.quantity > 0 && p.quantity <= p.minimum_threshold).length || 0;
  const outOfStockParts = parts?.filter(p => p.quantity === 0).length || 0;
  const totalValue = parts?.reduce((sum, p) => sum + (p.quantity * p.unit_cost), 0) || 0;

  return { totalParts, lowStockParts, outOfStockParts, totalValue };
}

// ─── Stock Updates (optimistic, with audit log) ───

export type StockAction = 'add' | 'remove' | 'adjust';

export interface StockLogEntry {
  id: string;
  part_id: string;
  change_amount: number;
  resulting_quantity: number;
  action: StockAction;
  performed_by: string | null;
  created_at: string;
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  const { handleRLSError } = useRBAC();

  return useMutation({
    mutationFn: async ({
      partId,
      action,
      amount,
      userId,
    }: {
      partId: string;
      action: StockAction;
      amount: number;
      userId: string | null;
    }) => {
      // 1. Read current quantity
      const { data: current, error: readErr } = await supabase
        .from('spare_parts')
        .select('quantity')
        .eq('id', partId)
        .single();
      if (readErr) throw readErr;

      const oldQty = (current as { quantity: number }).quantity;
      let newQty: number;

      if (action === 'add') newQty = oldQty + amount;
      else if (action === 'remove') newQty = oldQty - amount;
      else newQty = amount; // adjust = set exact

      if (newQty < 0) throw new Error('Stock cannot go below zero');

      // 2. Update quantity
      const { error: updateErr } = await supabase
        .from('spare_parts')
        .update({ quantity: newQty })
        .eq('id', partId);
      if (updateErr) throw updateErr;

      // 3. Insert audit log
      const changeAmount = newQty - oldQty;
      const { error: logErr } = await (supabase
        .from('spare_parts_stock_log' as 'assets')
        .insert({
          part_id: partId,
          change_amount: changeAmount,
          resulting_quantity: newQty,
          action,
          performed_by: userId,
        } as never) as unknown as Promise<{ error: Error | null }>);
      if (logErr) throw logErr;

      return { partId, newQty, changeAmount };
    },
    // Optimistic update
    onMutate: async ({ partId, action, amount }) => {
      await queryClient.cancelQueries({ queryKey: ['spare-parts'] });
      const previous = queryClient.getQueryData<SparePart[]>(['spare-parts']);

      queryClient.setQueryData<SparePart[]>(['spare-parts'], (old) =>
        (old ?? []).map((p) => {
          if (p.id !== partId) return p;
          let newQty: number;
          if (action === 'add') newQty = p.quantity + amount;
          else if (action === 'remove') newQty = Math.max(p.quantity - amount, 0);
          else newQty = amount;
          return { ...p, quantity: newQty };
        }),
      );

      return { previous };
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['spare-parts'], context.previous);
      }
      const msg = handleRLSError(error);
      toast.error(`Stock update failed: ${msg}`);
    },
    onSuccess: ({ newQty }, { partId }) => {
      // Row-level cache update (no full refetch)
      queryClient.setQueryData<SparePart[]>(['spare-parts'], (old) =>
        (old ?? []).map((p) => (p.id === partId ? { ...p, quantity: newQty } : p)),
      );
      toast.success('Stock updated');
    },
  });
}

export function useStockLog(partId: string | null) {
  return useQuery({
    queryKey: ['stock-log', partId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('spare_parts_stock_log' as 'assets')
        .select('*')
        .eq('part_id', partId!)
        .order('created_at', { ascending: false })
        .limit(50) as unknown as Promise<{ data: StockLogEntry[] | null; error: Error | null }>);
      if (error) throw error;
      return (data ?? []) as StockLogEntry[];
    },
    enabled: !!partId,
  });
}

// ─── Purchase Orders ───

export interface PurchaseOrder {
  id: string;
  part_id: string;
  quantity: number;
  vendor: string;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  expected_delivery: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePurchaseOrders(partId: string | null) {
  return useQuery({
    queryKey: ['purchase-orders', partId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('spare_parts_purchase_orders' as 'assets')
        .select('*')
        .eq('part_id', partId!)
        .order('created_at', { ascending: false }) as unknown as Promise<{ data: PurchaseOrder[] | null; error: Error | null }>);
      if (error) throw error;
      return (data ?? []) as PurchaseOrder[];
    },
    enabled: !!partId,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (po: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase
        .from('spare_parts_purchase_orders' as 'assets')
        .insert(po as never)
        .select()
        .single() as unknown as Promise<{ data: PurchaseOrder | null; error: Error | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', variables.part_id] });
      toast.success('Purchase order created');
    },
    onError: () => toast.error('Failed to create purchase order'),
  });
}
