import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths } from 'date-fns';
import { ReportFilters } from './useReports';

export interface CostBreakdown {
  name: string;
  value: number;
  percentage: number;
}

export interface MonthlyCostTrend {
  month: string;
  maintenanceCost: number;
  repairCost: number;
}

export interface CategoryCost {
  category: string;
  maintenanceCost: number;
  repairCost: number;
  totalCost: number;
}

export interface TopExpenseItem {
  asset: string;
  type: string;
  date: string;
  cost: number;
}

export function useCostBreakdown(filters: ReportFilters) {
  return useQuery({
    queryKey: ['cost-breakdown', filters],
    queryFn: async () => {
      // Get work orders with costs
      let workOrderQuery = supabase
        .from('work_orders')
        .select(`
          id,
          estimated_cost,
          work_order_type,
          created_at,
          assets:asset_id (category)
        `);

      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        switch (filters.dateRange) {
          case 'last_month':
            startDate = subMonths(now, 1);
            break;
          case 'last_quarter':
            startDate = subMonths(now, 3);
            break;
          case 'last_year':
            startDate = subMonths(now, 12);
            break;
          default:
            startDate = new Date(0);
        }
        workOrderQuery = workOrderQuery.gte('created_at', startDate.toISOString());
      }

      const { data: workOrders } = await workOrderQuery;

      // Get spare parts consumption
      let sparePartsQuery = supabase
        .from('spare_parts')
        .select('id, unit_cost, quantity, asset_id, created_at, assets:asset_id (category)');

      const { data: spareParts } = await sparePartsQuery;

      // Calculate cost categories
      let regularMaintenance = 0;
      let emergencyRepairs = 0;
      let partsReplacement = 0;
      let externalServices = 0;

      workOrders?.forEach(wo => {
        const asset = wo.assets as any;
        if (filters.assetType && filters.assetType !== 'all' && asset?.category !== filters.assetType) return;
        
        const cost = Number(wo.estimated_cost) || 0;
        
        switch (wo.work_order_type) {
          case 'Preventive':
          case 'Inspection':
            regularMaintenance += cost;
            break;
          case 'Emergency':
            emergencyRepairs += cost;
            break;
          case 'Corrective':
            // Split between repairs and external services
            emergencyRepairs += cost * 0.7;
            externalServices += cost * 0.3;
            break;
          case 'Warranty':
            externalServices += cost;
            break;
        }
      });

      spareParts?.forEach(sp => {
        const asset = sp.assets as any;
        if (filters.assetType && filters.assetType !== 'all' && asset?.category !== filters.assetType) return;
        partsReplacement += (Number(sp.unit_cost) || 0) * (sp.quantity || 0);
      });

      const total = regularMaintenance + emergencyRepairs + partsReplacement + externalServices;

      const breakdown: CostBreakdown[] = [
        { name: 'Regular Maintenance', value: regularMaintenance, percentage: total > 0 ? Math.round((regularMaintenance / total) * 100) : 0 },
        { name: 'Emergency Fixes', value: emergencyRepairs, percentage: total > 0 ? Math.round((emergencyRepairs / total) * 100) : 0 },
        { name: 'Parts Replacement', value: partsReplacement, percentage: total > 0 ? Math.round((partsReplacement / total) * 100) : 0 },
        { name: 'External Services', value: externalServices, percentage: total > 0 ? Math.round((externalServices / total) * 100) : 0 },
      ];

      return breakdown;
    },
  });
}

export function useMonthlyCostTrend(filters: ReportFilters) {
  return useQuery({
    queryKey: ['monthly-cost-trend', filters],
    queryFn: async () => {
      const now = new Date();
      const monthsToFetch = filters.dateRange === 'last_month' ? 1 
        : filters.dateRange === 'last_quarter' ? 3 
        : filters.dateRange === 'last_year' ? 12 
        : 6;

      const startDate = subMonths(now, monthsToFetch);

      const { data: workOrders } = await supabase
        .from('work_orders')
        .select(`
          id,
          estimated_cost,
          work_order_type,
          created_at,
          assets:asset_id (category)
        `)
        .gte('created_at', startDate.toISOString());

      // Initialize monthly data
      const monthlyData: Record<string, { maintenance: number; repair: number }> = {};
      
      for (let i = 0; i < monthsToFetch; i++) {
        const monthDate = subMonths(now, monthsToFetch - 1 - i);
        const monthKey = format(monthDate, 'MMM');
        monthlyData[monthKey] = { maintenance: 0, repair: 0 };
      }

      workOrders?.forEach(wo => {
        const asset = wo.assets as any;
        if (filters.assetType && filters.assetType !== 'all' && asset?.category !== filters.assetType) return;
        
        const monthKey = format(new Date(wo.created_at), 'MMM');
        if (!monthlyData[monthKey]) return;
        
        const cost = Number(wo.estimated_cost) || 0;
        
        if (wo.work_order_type === 'Preventive' || wo.work_order_type === 'Inspection') {
          monthlyData[monthKey].maintenance += cost;
        } else {
          monthlyData[monthKey].repair += cost;
        }
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        maintenanceCost: Math.round(data.maintenance),
        repairCost: Math.round(data.repair),
      }));
    },
  });
}

export function useCategoryWiseCost(filters: ReportFilters) {
  return useQuery({
    queryKey: ['category-wise-cost', filters],
    queryFn: async () => {
      let query = supabase
        .from('work_orders')
        .select(`
          id,
          estimated_cost,
          work_order_type,
          created_at,
          assets:asset_id (category)
        `);

      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        switch (filters.dateRange) {
          case 'last_month':
            startDate = subMonths(now, 1);
            break;
          case 'last_quarter':
            startDate = subMonths(now, 3);
            break;
          case 'last_year':
            startDate = subMonths(now, 12);
            break;
          default:
            startDate = new Date(0);
        }
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: workOrders } = await query;

      const categoryCosts: Record<string, { maintenance: number; repair: number }> = {};

      workOrders?.forEach(wo => {
        const asset = wo.assets as any;
        const category = asset?.category || 'Unknown';
        if (filters.assetType && filters.assetType !== 'all' && category !== filters.assetType) return;
        
        if (!categoryCosts[category]) {
          categoryCosts[category] = { maintenance: 0, repair: 0 };
        }

        const cost = Number(wo.estimated_cost) || 0;
        
        if (wo.work_order_type === 'Preventive' || wo.work_order_type === 'Inspection') {
          categoryCosts[category].maintenance += cost;
        } else {
          categoryCosts[category].repair += cost;
        }
      });

      return Object.entries(categoryCosts).map(([category, costs]) => ({
        category,
        maintenanceCost: Math.round(costs.maintenance),
        repairCost: Math.round(costs.repair),
        totalCost: Math.round(costs.maintenance + costs.repair),
      }));
    },
  });
}

export function useTopExpenseItems(filters: ReportFilters) {
  return useQuery({
    queryKey: ['top-expense-items', filters],
    queryFn: async () => {
      let query = supabase
        .from('work_orders')
        .select(`
          id,
          title,
          estimated_cost,
          work_order_type,
          created_at,
          assets:asset_id (asset_name, category)
        `)
        .not('estimated_cost', 'is', null)
        .order('estimated_cost', { ascending: false })
        .limit(10);

      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        switch (filters.dateRange) {
          case 'last_month':
            startDate = subMonths(now, 1);
            break;
          case 'last_quarter':
            startDate = subMonths(now, 3);
            break;
          case 'last_year':
            startDate = subMonths(now, 12);
            break;
          default:
            startDate = new Date(0);
        }
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: workOrders } = await query;

      const items: TopExpenseItem[] = (workOrders || [])
        .filter(wo => {
          const asset = wo.assets as any;
          if (filters.assetType && filters.assetType !== 'all') {
            return asset?.category === filters.assetType;
          }
          return true;
        })
        .slice(0, 5)
        .map(wo => {
          const asset = wo.assets as any;
          return {
            asset: asset?.asset_name || 'Unknown Asset',
            type: wo.work_order_type === 'Preventive' || wo.work_order_type === 'Inspection' ? 'Maintenance' 
              : wo.work_order_type === 'Emergency' ? 'Repair'
              : wo.work_order_type === 'Warranty' ? 'Service'
              : 'Parts',
            date: format(new Date(wo.created_at), 'dd/MM/yyyy'),
            cost: Number(wo.estimated_cost) || 0,
          };
        });

      return items;
    },
  });
}

export function useCostSummary(filters: ReportFilters) {
  return useQuery({
    queryKey: ['cost-summary', filters],
    queryFn: async () => {
      // Get current period costs
      let currentQuery = supabase
        .from('work_orders')
        .select(`
          id,
          estimated_cost,
          created_at,
          assets:asset_id (category)
        `);

      const now = new Date();
      let currentStartDate: Date;
      let previousStartDate: Date;
      let previousEndDate: Date;

      switch (filters.dateRange) {
        case 'last_month':
          currentStartDate = subMonths(now, 1);
          previousStartDate = subMonths(now, 2);
          previousEndDate = subMonths(now, 1);
          break;
        case 'last_quarter':
          currentStartDate = subMonths(now, 3);
          previousStartDate = subMonths(now, 6);
          previousEndDate = subMonths(now, 3);
          break;
        case 'last_year':
          currentStartDate = subMonths(now, 12);
          previousStartDate = subMonths(now, 24);
          previousEndDate = subMonths(now, 12);
          break;
        default:
          currentStartDate = subMonths(now, 12);
          previousStartDate = subMonths(now, 24);
          previousEndDate = subMonths(now, 12);
      }

      currentQuery = currentQuery.gte('created_at', currentStartDate.toISOString());
      const { data: currentWorkOrders } = await currentQuery;

      const { data: previousWorkOrders } = await supabase
        .from('work_orders')
        .select('id, estimated_cost, created_at, assets:asset_id (category)')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', previousEndDate.toISOString());

      // Get spare parts costs
      const { data: spareParts } = await supabase
        .from('spare_parts')
        .select('unit_cost, quantity, assets:asset_id (category)');

      // Get unique assets
      let assetsQuery = supabase.from('assets').select('id, category');
      if (filters.assetType && filters.assetType !== 'all') {
        assetsQuery = assetsQuery.eq('category', filters.assetType);
      }
      const { data: assets } = await assetsQuery;

      // Calculate current total
      let currentTotal = 0;
      currentWorkOrders?.forEach(wo => {
        const asset = wo.assets as any;
        if (filters.assetType && filters.assetType !== 'all' && asset?.category !== filters.assetType) return;
        currentTotal += Number(wo.estimated_cost) || 0;
      });

      // Add spare parts costs
      spareParts?.forEach(sp => {
        const asset = sp.assets as any;
        if (filters.assetType && filters.assetType !== 'all' && asset?.category !== filters.assetType) return;
        currentTotal += (Number(sp.unit_cost) || 0) * (sp.quantity || 0);
      });

      // Calculate previous total
      let previousTotal = 0;
      previousWorkOrders?.forEach(wo => {
        const asset = wo.assets as any;
        if (filters.assetType && filters.assetType !== 'all' && asset?.category !== filters.assetType) return;
        previousTotal += Number(wo.estimated_cost) || 0;
      });

      const totalAssets = assets?.length || 1;
      const avgCostPerAsset = currentTotal / totalAssets;

      // Calculate YoY change
      const costReductionYoY = previousTotal > 0 
        ? Math.round(((previousTotal - currentTotal) / previousTotal) * 1000) / 10
        : 0;

      return {
        totalCost: Math.round(currentTotal),
        avgCostPerAsset: Math.round(avgCostPerAsset * 100) / 100,
        costReductionYoY,
        previousPeriodCost: Math.round(previousTotal),
      };
    },
  });
}
