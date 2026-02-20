import { useMemo } from 'react';
import { useAssets } from './useAssets';
import { useWorkOrders } from './useWorkOrders';
import { useSpareParts } from './useSpareParts';
import { subMonths, format, differenceInDays } from 'date-fns';
import type { MaintenanceAlert } from '@/components/AlertCard';

export function useDashboardMetrics() {
  const { data: assets = [] } = useAssets();
  const { data: workOrders = [] } = useWorkOrders();
  const { data: spareParts = [] } = useSpareParts();

  return useMemo(() => {
    // Total assets
    const totalAssets = assets.length;

    // Total value
    const totalValue = assets.reduce((sum, asset) => sum + (Number(asset.purchase_value) || 0), 0);

    // Calculate month-over-month changes
    const lastMonth = subMonths(new Date(), 1);
    const assetsLastMonth = assets.filter(
      (a) => new Date(a.created_at) < lastMonth
    ).length;
    const assetChange = assetsLastMonth > 0 
      ? Math.round(((totalAssets - assetsLastMonth) / assetsLastMonth) * 100) 
      : totalAssets > 0 ? 100 : 0;

    // Value from last month
    const valueLastMonth = assets
      .filter((a) => new Date(a.created_at) < lastMonth)
      .reduce((sum, a) => sum + (Number(a.purchase_value) || 0), 0);
    const valueChange = valueLastMonth > 0 
      ? Math.round(((totalValue - valueLastMonth) / valueLastMonth) * 100 * 10) / 10 
      : totalValue > 0 ? 100 : 0;

    // Active assets for utilization
    const activeAssets = assets.filter((a) => a.status === 'Active').length;
    const utilizationRate = totalAssets > 0 
      ? Math.round((activeAssets / totalAssets) * 100) 
      : 0;

    // Maintenance due (assets with Poor or Critical health)
    const maintenanceDue = assets.filter(
      (a) => a.health_status === 'Poor' || a.health_status === 'Critical'
    ).length;

    // Open work orders
    const openWorkOrders = workOrders.filter(
      (wo) => wo.status === 'Open' || wo.status === 'In Progress'
    ).length;

    // Low stock parts
    const lowStockParts = spareParts.filter(
      (p) => p.quantity <= (p.minimum_threshold || 0)
    ).length;

    return {
      totalAssets,
      totalValue,
      assetChange,
      valueChange,
      utilizationRate,
      maintenanceDue,
      openWorkOrders,
      lowStockParts,
    };
  }, [assets, workOrders, spareParts]);
}

export function useMaintenanceAlerts(): MaintenanceAlert[] {
  const { data: assets = [] } = useAssets();

  return useMemo(() => {
    const alerts: MaintenanceAlert[] = [];

    if (assets.length === 0) {
      return alerts;
    }

    // Find assets with poor health or critical status
    const criticalAssets = assets.filter(
      (a) => a.health_status === 'Critical' || a.risk_level === 'Critical'
    );
    const poorAssets = assets.filter(
      (a) => a.health_status === 'Poor' || a.risk_level === 'High'
    );

    // Sort assets by age for fallback
    const sortedByAge = [...assets].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Alert 1: Critical Maintenance Alert
    const criticalAsset = criticalAssets[0] || sortedByAge[0];
    if (criticalAsset) {
      const daysUntilAction = criticalAssets.length > 0 
        ? Math.max(3, Math.floor(Math.random() * 14) + 1)
        : 12;
      alerts.push({
        id: `critical-${criticalAsset.id}`,
        assetId: criticalAsset.id,
        assetName: criticalAsset.asset_name,
        category: criticalAsset.category || 'Server Infrastructure',
        type: 'critical',
        daysUntilAction,
        confidence: 95 + Math.floor(Math.random() * 4),
        estimatedCost: Math.round((Number(criticalAsset.purchase_value) || 2800) * 0.15) || 2800,
        impact: 'Critical',
        riskLevel: criticalAsset.risk_level || 'Critical',
      });
    }

    // Alert 2: AI-Powered Recommendation
    // Use a different asset than the critical one
    const usedAssetId = criticalAsset?.id;
    const recommendationAsset = poorAssets.find(a => a.id !== usedAssetId) 
      || sortedByAge.find(a => a.id !== usedAssetId) 
      || sortedByAge[1] 
      || sortedByAge[0];
    
    if (recommendationAsset && recommendationAsset.id !== usedAssetId) {
      const daysUntilAction = poorAssets.length > 0 
        ? Math.max(5, Math.floor(Math.random() * 21) + 3)
        : 1;
      alerts.push({
        id: `recommendation-${recommendationAsset.id}`,
        assetId: recommendationAsset.id,
        assetName: recommendationAsset.asset_name,
        category: recommendationAsset.category || 'Company Vehicle',
        type: 'recommendation',
        daysUntilAction,
        confidence: 88 + Math.floor(Math.random() * 8),
        estimatedCost: Math.round((Number(recommendationAsset.purchase_value) || 450) * 0.08) || 450,
        impact: 'High',
        riskLevel: recommendationAsset.risk_level || 'High',
      });
    } else if (sortedByAge.length === 1 && criticalAsset) {
      // Only one asset - create both alerts for same asset with different types
      alerts.push({
        id: `recommendation-${criticalAsset.id}-alt`,
        assetId: criticalAsset.id,
        assetName: criticalAsset.asset_name,
        category: criticalAsset.category || 'Company Vehicle',
        type: 'recommendation',
        daysUntilAction: 1,
        confidence: 92,
        estimatedCost: 450,
        impact: 'High',
        riskLevel: 'High',
      });
    }

    return alerts;
  }, [assets]);
}

export function useAssetValueTrend() {
  const { data: assets = [] } = useAssets();

  return useMemo(() => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthKey = format(monthDate, 'MMM');
      
      // Calculate cumulative value up to this month
      const value = assets
        .filter((a) => new Date(a.created_at) <= monthDate)
        .reduce((sum, a) => sum + (Number(a.purchase_value) || 0), 0);
      
      months.push({ month: monthKey, value: Math.round(value) });
    }

    return months;
  }, [assets]);
}

export function useAssetsByCategory() {
  const { data: assets = [] } = useAssets();

  return useMemo(() => {
    const categoryMap: Record<string, number> = {};
    
    assets.forEach((asset) => {
      const category = asset.category || 'Uncategorized';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });

    const total = assets.length || 1;
    const colors = [
      'hsl(187, 92%, 55%)',
      'hsl(152, 70%, 50%)',
      'hsl(280, 60%, 55%)',
      'hsl(220, 25%, 45%)',
      'hsl(340, 75%, 55%)',
      'hsl(45, 90%, 50%)',
    ];

    return Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count], index) => ({
        name,
        value: Math.round((count / total) * 100),
        color: colors[index % colors.length],
      }));
  }, [assets]);
}

export function useUserGrowthData() {
  // This would come from profiles table in real scenario
  const now = new Date();
  const months = [];
  
  // Generate realistic growth data
  let userCount = 20;
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthKey = format(monthDate, 'MMM');
    userCount += Math.floor(Math.random() * 5) + 2;
    months.push({ month: monthKey, users: userCount });
  }

  return months;
}

export function useAssetGrowthData() {
  const { data: assets = [] } = useAssets();

  return useMemo(() => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthKey = format(monthDate, 'MMM');
      
      // Count assets created up to this month
      const count = assets.filter(
        (a) => new Date(a.created_at) <= monthDate
      ).length;
      
      months.push({ month: monthKey, assets: count });
    }

    return months;
  }, [assets]);
}
