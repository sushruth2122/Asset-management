import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, differenceInHours, differenceInDays } from 'date-fns';
import { ReportFilters } from './useReports';

export interface MTBFMTTRData {
  category: string;
  mtbf: number; // Mean Time Between Failures in days
  mttr: number; // Mean Time To Repair in hours
  failureCount: number;
  totalRepairHours: number;
}

export interface MonthlyMetrics {
  month: string;
  mtbf: number;
  mttr: number;
}

export interface CategoryFailures {
  category: string;
  failureCount: number;
}

export function useMTBFMTTRMetrics(filters: ReportFilters) {
  return useQuery({
    queryKey: ['mtbf-mttr-metrics', filters],
    queryFn: async () => {
      // Get all work orders that are completed (representing repairs/failures)
      let workOrderQuery = supabase
        .from('work_orders')
        .select(`
          id,
          created_at,
          completed_at,
          work_order_type,
          status,
          asset_id,
          assets:asset_id (
            id,
            category,
            asset_name,
            purchase_date
          )
        `)
        .in('work_order_type', ['Corrective', 'Emergency']);

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

      const { data: workOrders, error } = await workOrderQuery;
      if (error) throw error;

      // Get all assets
      let assetsQuery = supabase.from('assets').select('id, category, asset_name, purchase_date, created_at');
      if (filters.assetType && filters.assetType !== 'all') {
        assetsQuery = assetsQuery.eq('category', filters.assetType);
      }
      const { data: assets } = await assetsQuery;

      // Calculate metrics by category
      const categoryMetrics: Record<string, {
        failures: number;
        totalRepairHours: number;
        totalOperationalDays: number;
        assetCount: number;
      }> = {};

      // Initialize categories from assets
      assets?.forEach(asset => {
        const category = asset.category || 'Uncategorized';
        if (!categoryMetrics[category]) {
          categoryMetrics[category] = {
            failures: 0,
            totalRepairHours: 0,
            totalOperationalDays: 0,
            assetCount: 0
          };
        }
        categoryMetrics[category].assetCount++;
        
        // Calculate operational days from purchase date
        const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date(asset.created_at);
        categoryMetrics[category].totalOperationalDays += differenceInDays(new Date(), purchaseDate);
      });

      // Process work orders for failure data
      workOrders?.forEach(wo => {
        const asset = wo.assets as any;
        if (!asset) return;
        
        const category = asset.category || 'Uncategorized';
        if (filters.assetType && filters.assetType !== 'all' && category !== filters.assetType) return;
        
        if (!categoryMetrics[category]) {
          categoryMetrics[category] = {
            failures: 0,
            totalRepairHours: 0,
            totalOperationalDays: 0,
            assetCount: 0
          };
        }
        
        categoryMetrics[category].failures++;
        
        // Calculate repair time if completed
        if (wo.completed_at && wo.created_at) {
          const repairHours = differenceInHours(
            new Date(wo.completed_at),
            new Date(wo.created_at)
          );
          categoryMetrics[category].totalRepairHours += Math.max(0, repairHours);
        }
      });

      // Calculate MTBF and MTTR
      const result: MTBFMTTRData[] = Object.entries(categoryMetrics)
        .filter(([_, metrics]) => metrics.assetCount > 0)
        .map(([category, metrics]) => ({
          category,
          mtbf: metrics.failures > 0 
            ? Math.round((metrics.totalOperationalDays / metrics.failures) * 10) / 10
            : metrics.totalOperationalDays / (metrics.assetCount || 1),
          mttr: metrics.failures > 0 
            ? Math.round((metrics.totalRepairHours / metrics.failures) * 10) / 10
            : 0,
          failureCount: metrics.failures,
          totalRepairHours: metrics.totalRepairHours
        }));

      return result;
    },
  });
}

export function useMonthlyMTBFMTTR(filters: ReportFilters) {
  return useQuery({
    queryKey: ['monthly-mtbf-mttr', filters],
    queryFn: async () => {
      const now = new Date();
      const monthsToFetch = filters.dateRange === 'last_month' ? 1 
        : filters.dateRange === 'last_quarter' ? 3 
        : filters.dateRange === 'last_year' ? 12 
        : 12;

      const startDate = subMonths(now, monthsToFetch);

      let query = supabase
        .from('work_orders')
        .select(`
          id,
          created_at,
          completed_at,
          work_order_type,
          asset_id,
          assets:asset_id (category)
        `)
        .in('work_order_type', ['Corrective', 'Emergency'])
        .gte('created_at', startDate.toISOString());

      const { data: workOrders, error } = await query;
      if (error) throw error;

      // Get asset count for MTBF calculation
      let assetsQuery = supabase.from('assets').select('id, category');
      if (filters.assetType && filters.assetType !== 'all') {
        assetsQuery = assetsQuery.eq('category', filters.assetType);
      }
      const { data: assets } = await assetsQuery;
      const totalAssets = assets?.length || 1;

      // Group by month
      const monthlyData: Record<string, { failures: number; totalRepairHours: number; days: number }> = {};
      
      for (let i = 0; i < monthsToFetch; i++) {
        const monthDate = subMonths(now, monthsToFetch - 1 - i);
        const monthKey = format(monthDate, 'MMM');
        monthlyData[monthKey] = { failures: 0, totalRepairHours: 0, days: 30 };
      }

      workOrders?.forEach((wo) => {
        const asset = wo.assets as any;
        if (filters.assetType && filters.assetType !== 'all' && asset?.category !== filters.assetType) return;
        
        const monthKey = format(new Date(wo.created_at), 'MMM');
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].failures++;
          
          if (wo.completed_at) {
            const repairHours = differenceInHours(
              new Date(wo.completed_at),
              new Date(wo.created_at)
            );
            monthlyData[monthKey].totalRepairHours += Math.max(0, repairHours);
          }
        }
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        mtbf: data.failures > 0 
          ? Math.round((totalAssets * 30 / data.failures) * 10) / 10
          : totalAssets * 30,
        mttr: data.failures > 0 
          ? Math.round((data.totalRepairHours / data.failures) * 10) / 10
          : 0,
      }));
    },
  });
}

export function useCategoryFailures(filters: ReportFilters) {
  return useQuery({
    queryKey: ['category-failures', filters],
    queryFn: async () => {
      let query = supabase
        .from('work_orders')
        .select(`
          id,
          created_at,
          work_order_type,
          assets:asset_id (category)
        `)
        .in('work_order_type', ['Corrective', 'Emergency']);

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

      const { data: workOrders, error } = await query;
      if (error) throw error;

      const categoryFailures: Record<string, number> = {};
      
      workOrders?.forEach((wo) => {
        const asset = wo.assets as any;
        const category = asset?.category || 'Unknown';
        if (filters.assetType && filters.assetType !== 'all' && category !== filters.assetType) return;
        
        categoryFailures[category] = (categoryFailures[category] || 0) + 1;
      });

      return Object.entries(categoryFailures).map(([category, failureCount]) => ({
        category,
        failureCount,
      }));
    },
  });
}

export function useMTBFMTTRSummary(filters: ReportFilters) {
  return useQuery({
    queryKey: ['mtbf-mttr-summary', filters],
    queryFn: async () => {
      // Get completed work orders for repair time
      let workOrderQuery = supabase
        .from('work_orders')
        .select(`
          id,
          created_at,
          completed_at,
          work_order_type,
          status,
          assets:asset_id (category)
        `)
        .in('work_order_type', ['Corrective', 'Emergency']);

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

      // Get all assets
      let assetsQuery = supabase.from('assets').select('id, category, purchase_date, created_at, status');
      if (filters.assetType && filters.assetType !== 'all') {
        assetsQuery = assetsQuery.eq('category', filters.assetType);
      }
      const { data: assets } = await assetsQuery;

      const totalAssets = assets?.length || 0;
      const activeAssets = assets?.filter(a => a.status === 'Active').length || 0;

      // Filter work orders by asset type if needed
      const filteredWorkOrders = workOrders?.filter(wo => {
        const asset = wo.assets as any;
        if (filters.assetType && filters.assetType !== 'all') {
          return asset?.category === filters.assetType;
        }
        return true;
      }) || [];

      const totalFailures = filteredWorkOrders.length;
      
      // Calculate total operational time
      let totalOperationalDays = 0;
      assets?.forEach(asset => {
        const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date(asset.created_at);
        totalOperationalDays += differenceInDays(new Date(), purchaseDate);
      });

      // Calculate total repair time
      let totalRepairHours = 0;
      let completedRepairs = 0;
      
      filteredWorkOrders.forEach(wo => {
        if (wo.completed_at && wo.created_at) {
          const repairHours = differenceInHours(
            new Date(wo.completed_at),
            new Date(wo.created_at)
          );
          if (repairHours > 0) {
            totalRepairHours += repairHours;
            completedRepairs++;
          }
        }
      });

      // Calculate averages
      const avgMTBF = totalFailures > 0 
        ? Math.round((totalOperationalDays / totalFailures) * 10) / 10
        : totalOperationalDays;
      
      const avgMTTR = completedRepairs > 0 
        ? Math.round((totalRepairHours / completedRepairs) * 10) / 10
        : 0;

      // Availability = (Total time - Downtime) / Total time * 100
      const totalDowntimeHours = totalRepairHours;
      const totalOperationalHours = totalOperationalDays * 24;
      const availability = totalOperationalHours > 0 
        ? Math.round(((totalOperationalHours - totalDowntimeHours) / totalOperationalHours) * 1000) / 10
        : 100;

      return {
        avgMTBF,
        avgMTTR,
        availability: Math.min(availability, 100),
        totalFailures,
        totalAssets,
        activeAssets,
      };
    },
  });
}
