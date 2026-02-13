import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type LifecycleEventType =
  | 'acquired' | 'deployed' | 'maintenance' | 'repair'
  | 'transfer' | 'returned' | 'decommissioned'
  | 'commissioned' | 'relocated' | 'maintenance_start' | 'maintenance_end'
  | 'deactivated' | 'reactivated' | 'retired' | 'disposed'
  | 'transferred' | 'inspected';

// ─── Types ───

export type DocumentType = 'manual' | 'warranty' | 'certificate' | 'inspection' | 'compliance' | 'general';

export interface AssetDocument {
  id: string;
  asset_id: string;
  document_name: string;
  name: string | null;
  document_type: DocumentType;
  file_url: string | null;
  file_size_bytes: number | null;
  uploaded_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetInsurance {
  id: string;
  asset_id: string;
  provider: string;
  policy_number: string;
  coverage_type: string;
  premium_amount: number;
  coverage_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  document_url: string | null;
  storage_path: string | null;
  reminder_enabled: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetWarranty {
  id: string;
  asset_id: string;
  provider: string;
  warranty_type: string;
  start_date: string;
  end_date: string;
  terms: string | null;
  document_url: string | null;
  storage_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetFinancial {
  id: string;
  asset_id: string;
  record_type: 'depreciation' | 'maintenance_cost' | 'repair_cost' | 'upgrade_cost' | 'valuation';
  amount: number;
  effective_date: string;
  description: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface AssetLifecycleEvent {
  id: string;
  asset_id: string;
  event_type: string;
  title: string | null;
  from_stage: string | null;
  to_stage: string | null;
  description: string | null;
  performed_by: string | null;
  event_date: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Documents ───

export function useAssetDocuments(assetId: string | null) {
  return useQuery({
    queryKey: ['asset_documents', assetId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('asset_documents' as 'assets')
        .select('*')
        .eq('asset_id', assetId!)
        .order('created_at', { ascending: false }) as unknown as Promise<{ data: AssetDocument[] | null; error: Error | null }>);
      if (error) throw error;
      return (data ?? []) as AssetDocument[];
    },
    enabled: !!assetId,
  });
}

export function useCreateAssetDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doc: Omit<AssetDocument, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase
        .from('asset_documents' as 'assets')
        .insert(doc as never)
        .select()
        .single() as unknown as Promise<{ data: AssetDocument | null; error: Error | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['asset_documents', variables.asset_id] });
      toast.success('Document added');
    },
    onError: () => toast.error('Failed to add document'),
  });
}

// ─── Insurance ───

export function useAssetInsurance(assetId: string | null) {
  return useQuery({
    queryKey: ['asset_insurance', assetId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('asset_insurance' as 'assets')
        .select('*')
        .eq('asset_id', assetId!)
        .order('end_date', { ascending: false }) as unknown as Promise<{ data: AssetInsurance[] | null; error: Error | null }>);
      if (error) throw error;
      return (data ?? []) as AssetInsurance[];
    },
    enabled: !!assetId,
  });
}

export function useCreateAssetInsurance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ins: Omit<AssetInsurance, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase
        .from('asset_insurance' as 'assets')
        .insert(ins as never)
        .select()
        .single() as unknown as Promise<{ data: AssetInsurance | null; error: Error | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['asset_insurance', variables.asset_id] });
      toast.success('Insurance policy added');
    },
    onError: () => toast.error('Failed to add insurance'),
  });
}

// ─── Warranties ───

export function useAssetWarranties(assetId: string | null) {
  return useQuery({
    queryKey: ['asset_warranties', assetId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('asset_warranties' as 'assets')
        .select('*')
        .eq('asset_id', assetId!)
        .order('end_date', { ascending: false }) as unknown as Promise<{ data: AssetWarranty[] | null; error: Error | null }>);
      if (error) throw error;
      return (data ?? []) as AssetWarranty[];
    },
    enabled: !!assetId,
  });
}

export function useCreateAssetWarranty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (w: Omit<AssetWarranty, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase
        .from('asset_warranties' as 'assets')
        .insert(w as never)
        .select()
        .single() as unknown as Promise<{ data: AssetWarranty | null; error: Error | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['asset_warranties', variables.asset_id] });
      toast.success('Warranty added');
    },
    onError: () => toast.error('Failed to add warranty'),
  });
}

export function useUpdateAssetWarranty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, asset_id, ...updates }: { id: string; asset_id: string } & Partial<Omit<AssetWarranty, 'id' | 'created_at' | 'updated_at'>>) => {
      const { data, error } = await (supabase
        .from('asset_warranties' as 'assets')
        .update(updates as never)
        .eq('id', id as never)
        .select()
        .single() as unknown as Promise<{ data: AssetWarranty | null; error: Error | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['asset_warranties', variables.asset_id] });
      toast.success('Warranty updated');
    },
    onError: () => toast.error('Failed to update warranty'),
  });
}

// ─── Financials ───

export function useAssetFinancials(assetId: string | null) {
  return useQuery({
    queryKey: ['asset_financials', assetId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('asset_financials' as 'assets')
        .select('*')
        .eq('asset_id', assetId!)
        .order('effective_date', { ascending: false }) as unknown as Promise<{ data: AssetFinancial[] | null; error: Error | null }>);
      if (error) throw error;
      return (data ?? []) as AssetFinancial[];
    },
    enabled: !!assetId,
  });
}

export function useCreateAssetFinancial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fin: Omit<AssetFinancial, 'id' | 'created_at'>) => {
      const { data, error } = await (supabase
        .from('asset_financials' as 'assets')
        .insert(fin as never)
        .select()
        .single() as unknown as Promise<{ data: AssetFinancial | null; error: Error | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['asset_financials', variables.asset_id] });
      toast.success('Financial record added');
    },
    onError: () => toast.error('Failed to add financial record'),
  });
}

// ─── Lifecycle Events ───

export function useAssetLifecycleEvents(assetId: string | null) {
  return useQuery({
    queryKey: ['asset_lifecycle_events', assetId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('asset_lifecycle_events' as 'assets')
        .select('*')
        .eq('asset_id', assetId!)
        .order('event_date', { ascending: false }) as unknown as Promise<{ data: AssetLifecycleEvent[] | null; error: Error | null }>);
      if (error) throw error;
      return (data ?? []) as AssetLifecycleEvent[];
    },
    enabled: !!assetId,
  });
}

export function useCreateLifecycleEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: Omit<AssetLifecycleEvent, 'id' | 'created_at'>) => {
      const { data, error } = await (supabase
        .from('asset_lifecycle_events' as 'assets')
        .insert(event as never)
        .select()
        .single() as unknown as Promise<{ data: AssetLifecycleEvent | null; error: Error | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['asset_lifecycle_events', variables.asset_id] });
      toast.success('Lifecycle event recorded');
    },
    onError: () => toast.error('Failed to record lifecycle event'),
  });
}

// ─── Realtime subscription for lifecycle events (scoped to one asset) ───

export function useLifecycleRealtime(assetId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!assetId) return;

    const channel = supabase
      .channel(`lifecycle-${assetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asset_lifecycle_events',
          filter: `asset_id=eq.${assetId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['asset_lifecycle_events', assetId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [assetId, queryClient]);
}

// ─── Update insurance policy (for adding document_url after upload) ───

export function useUpdateAssetInsurance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, asset_id, ...updates }: { id: string; asset_id: string } & Partial<Omit<AssetInsurance, 'id' | 'created_at' | 'updated_at'>>) => {
      const { data, error } = await (supabase
        .from('asset_insurance' as 'assets')
        .update(updates as never)
        .eq('id', id as never)
        .select()
        .single() as unknown as Promise<{ data: AssetInsurance | null; error: Error | null }>);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['asset_insurance', variables.asset_id] });
      toast.success('Insurance updated');
    },
    onError: () => toast.error('Failed to update insurance'),
  });
}

// ─── Delete document ───

export function useDeleteAssetDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, asset_id }: { id: string; asset_id: string }) => {
      const { error } = await (supabase
        .from('asset_documents' as 'assets')
        .delete()
        .eq('id', id as never) as unknown as Promise<{ error: Error | null }>);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['asset_documents', variables.asset_id] });
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });
}

/* ---------- Asset-scoped Work Orders ---------- */

interface AssetWorkOrder {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  completed_at: string | null;
  estimated_cost: number | null;
}

export function useAssetWorkOrders(assetId: string | null) {
  return useQuery({
    queryKey: ['asset_work_orders', assetId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('work_orders' as 'assets')
        .select('id, title, status, priority, created_at, completed_at, estimated_cost')
        .eq('asset_id', assetId!)
        .order('created_at', { ascending: false }) as unknown as Promise<{ data: AssetWorkOrder[] | null; error: Error | null }>);
      if (error) throw error;
      return (data ?? []) as AssetWorkOrder[];
    },
    enabled: !!assetId,
  });
}

/* ---------- Asset-scoped Costs (financials) ---------- */

interface AssetCost {
  id: string;
  cost_type: string;
  amount: number;
  effective_date: string;
}

export function useAssetCosts(assetId: string | null) {
  return useQuery({
    queryKey: ['asset_costs', assetId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('asset_financials' as 'assets')
        .select('id, cost_type, amount, effective_date')
        .eq('asset_id', assetId!)
        .order('effective_date', { ascending: false }) as unknown as Promise<{ data: AssetCost[] | null; error: Error | null }>);
      if (error) throw error;
      return (data ?? []) as AssetCost[];
    },
    enabled: !!assetId,
  });
}
