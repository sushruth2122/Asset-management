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
