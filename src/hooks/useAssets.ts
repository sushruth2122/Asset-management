import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRBAC } from './useRBAC';

export type LifecycleStage = 'planning' | 'active' | 'maintenance' | 'inactive' | 'retired' | 'disposed';

export const ACTIVE_STAGES: LifecycleStage[] = ['active', 'maintenance'];
export const NON_ACTIVE_STAGES: LifecycleStage[] = ['inactive', 'retired', 'disposed'];

export interface Asset {
  id: string;
  asset_name: string;
  asset_code: string;
  category: string;
  status: string;
  location: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  purchase_date: string | null;
  purchase_value: number;
  warranty_expiry: string | null;
  custodian: string;
  building_no: string;
  asset_type: string;
  specification: string;
  voltage: string;
  wattage: string;
  depreciation: string;
  insurance: string;
  amc: string;
  lease_status: string;
  created_at: string;
  updated_at: string;
  // GIS fields
  latitude: number | null;
  longitude: number | null;
  health_status: string | null;
  risk_level: string | null;
  // Lifecycle
  lifecycle_stage: LifecycleStage;
  // Financial (v2)
  purchase_price: number | null;
  acquisition_date: string | null;
  useful_life_years: number | null;
  depreciation_rate: number | null;
  salvage_value: number | null;
}

export type AssetInsert = Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'latitude' | 'longitude' | 'health_status' | 'risk_level' | 'lifecycle_stage' | 'purchase_price' | 'acquisition_date' | 'useful_life_years' | 'depreciation_rate' | 'salvage_value'> & {
  latitude?: number | null;
  longitude?: number | null;
  health_status?: string | null;
  risk_level?: string | null;
  lifecycle_stage?: LifecycleStage;
  purchase_price?: number | null;
  acquisition_date?: string | null;
  useful_life_years?: number | null;
  depreciation_rate?: number | null;
  salvage_value?: number | null;
};
export type AssetUpdate = Partial<AssetInsert>;

export function useAssets(lifecycleFilter?: 'active' | 'non-active' | 'all') {
  return useQuery({
    queryKey: ['assets', lifecycleFilter ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (lifecycleFilter === 'active') {
        query = query.in('lifecycle_stage', ACTIVE_STAGES);
      } else if (lifecycleFilter === 'non-active') {
        query = query.in('lifecycle_stage', NON_ACTIVE_STAGES);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Asset[];
    },
  });
}

export function useAsset(id: string | null) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Asset | null;
    },
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  const { isAuthenticated, handleRLSError } = useRBAC();

  return useMutation({
    mutationFn: async (asset: AssetInsert) => {
      // Frontend auth check - both admin and user can create
      if (!isAuthenticated) {
        throw new Error('Authentication required to create assets');
      }

      const { data, error } = await supabase
        .from('assets')
        .insert(asset)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset created successfully');
    },
    onError: (error: Error) => {
      const message = handleRLSError(error);
      toast.error(`Failed to create asset: ${message}`);
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const { isAuthenticated, handleRLSError } = useRBAC();

  return useMutation({
    mutationFn: async ({ id, ...updates }: AssetUpdate & { id: string }) => {
      // Frontend auth check - both admin and user can update
      if (!isAuthenticated) {
        throw new Error('Authentication required to update assets');
      }

      const { data, error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset updated successfully');
    },
    onError: (error: Error) => {
      const message = handleRLSError(error);
      toast.error(`Failed to update asset: ${message}`);
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const { isAuthenticated, handleRLSError } = useRBAC();

  return useMutation({
    mutationFn: async (id: string) => {
      // Frontend auth check - both admin and user can delete
      if (!isAuthenticated) {
        throw new Error('Authentication required to delete assets');
      }

      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset deleted successfully');
    },
    onError: (error: Error) => {
      const message = handleRLSError(error);
      toast.error(`Failed to delete asset: ${message}`);
    },
  });
}
