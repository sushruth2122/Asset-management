import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface AssetStatusCount {
  status: string;
  count: number;
}

export interface MonthlyAssetCount {
  month: string;
  count: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  value: number;
}

export interface ReportFilters {
  dateRange: 'last_month' | 'last_quarter' | 'last_year' | 'all';
  assetType: string | null;
}

export function useAssetStatusDistribution(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'status-distribution', filters],
    queryFn: async () => {
      let query = supabase
        .from('assets')
        .select('status');

      if (filters.assetType && filters.assetType !== 'all') {
        query = query.eq('category', filters.assetType);
      }

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

      const { data, error } = await query;

      if (error) throw error;

      // Count by status
      const statusCounts: Record<string, number> = {};
      data?.forEach((asset) => {
        const status = asset.status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      return Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));
    },
  });
}

export function useMonthlyAssetAcquisitions(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'monthly-acquisitions', filters],
    queryFn: async () => {
      const now = new Date();
      const monthsToFetch = filters.dateRange === 'last_month' ? 1 
        : filters.dateRange === 'last_quarter' ? 3 
        : filters.dateRange === 'last_year' ? 12 
        : 12;

      const startDate = subMonths(now, monthsToFetch);

      let query = supabase
        .from('assets')
        .select('created_at, category')
        .gte('created_at', startDate.toISOString());

      if (filters.assetType && filters.assetType !== 'all') {
        query = query.eq('category', filters.assetType);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by month
      const monthCounts: Record<string, number> = {};
      
      for (let i = 0; i < monthsToFetch; i++) {
        const monthDate = subMonths(now, monthsToFetch - 1 - i);
        const monthKey = format(monthDate, 'MMM');
        monthCounts[monthKey] = 0;
      }

      data?.forEach((asset) => {
        const monthKey = format(new Date(asset.created_at), 'MMM');
        if (monthCounts.hasOwnProperty(monthKey)) {
          monthCounts[monthKey]++;
        }
      });

      return Object.entries(monthCounts).map(([month, count]) => ({
        month,
        count,
      }));
    },
  });
}

export function useCategoryDistribution(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'category-distribution', filters],
    queryFn: async () => {
      let query = supabase
        .from('assets')
        .select('category, purchase_value');

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

      const { data, error } = await query;

      if (error) throw error;

      // Group by category
      const categoryData: Record<string, { count: number; value: number }> = {};
      data?.forEach((asset) => {
        const category = asset.category || 'Uncategorized';
        if (!categoryData[category]) {
          categoryData[category] = { count: 0, value: 0 };
        }
        categoryData[category].count++;
        categoryData[category].value += Number(asset.purchase_value) || 0;
      });

      return Object.entries(categoryData).map(([category, stats]) => ({
        category,
        count: stats.count,
        value: stats.value,
      }));
    },
  });
}

export function useAssetLifecycleStats(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'lifecycle-stats', filters],
    queryFn: async () => {
      let query = supabase
        .from('assets')
        .select('*');

      if (filters.assetType && filters.assetType !== 'all') {
        query = query.eq('category', filters.assetType);
      }

      const { data, error } = await query;

      if (error) throw error;

      const totalAssets = data?.length || 0;
      const totalValue = data?.reduce((sum, asset) => sum + (Number(asset.purchase_value) || 0), 0) || 0;
      const activeAssets = data?.filter(a => a.status === 'Active').length || 0;
      const maintenanceAssets = data?.filter(a => a.status === 'Maintenance').length || 0;
      const inactiveAssets = data?.filter(a => a.status === 'Inactive').length || 0;

      // Calculate average age
      const avgAge = data?.length 
        ? data.reduce((sum, asset) => {
            if (asset.purchase_date) {
              const purchaseYear = new Date(asset.purchase_date).getFullYear();
              const currentYear = new Date().getFullYear();
              return sum + (currentYear - purchaseYear);
            }
            return sum;
          }, 0) / data.length
        : 0;

      return {
        totalAssets,
        totalValue,
        activeAssets,
        maintenanceAssets,
        inactiveAssets,
        avgAge: Math.round(avgAge * 10) / 10,
      };
    },
  });
}
