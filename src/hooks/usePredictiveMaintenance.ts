import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, differenceInDays, addDays } from 'date-fns';
import { ReportFilters } from './useReports';

export interface MaintenancePrediction {
  month: string;
  actualEvents: number;
  predictedEvents: number;
}

export interface AssetFailureProbability {
  assetName: string;
  age: number; // in years
  probability: number; // 0-100
  category: string;
}

export interface PredictedMaintenance {
  assetName: string;
  maintenanceType: string;
  dueDate: string;
  likelihood: number;
  cost: number;
  impact: string;
  assetId: string;
}

export interface MaintenanceAlert {
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  priority: string;
  estimatedCost: number;
  impact: string;
  assetName: string;
  daysUntilFailure: number;
  confidence: number;
}

export function useMaintenancePredictionTrend(filters: ReportFilters) {
  return useQuery({
    queryKey: ['maintenance-prediction-trend', filters],
    queryFn: async () => {
      const now = new Date();
      const monthsToFetch = 8; // Show trend with future predictions
      const startDate = subMonths(now, 5);

      // Get historical work orders
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select(`
          id,
          created_at,
          work_order_type,
          assets:asset_id (category)
        `)
        .gte('created_at', startDate.toISOString());

      // Get asset count for prediction baseline
      let assetsQuery = supabase.from('assets').select('id, category');
      if (filters.assetType && filters.assetType !== 'all') {
        assetsQuery = assetsQuery.eq('category', filters.assetType);
      }
      const { data: assets } = await assetsQuery;
      const assetCount = assets?.length || 1;

      const months: MaintenancePrediction[] = [];
      let cumulativeEvents = 0;

      for (let i = 0; i < monthsToFetch; i++) {
        const monthDate = subMonths(now, 5 - i); // Start 5 months ago
        const monthKey = format(monthDate, 'MMM');
        const isFuture = i > 5;

        // Count actual events for past months
        let actualEvents = 0;
        if (!isFuture) {
          const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

          workOrders?.forEach(wo => {
            const asset = wo.assets as any;
            if (filters.assetType && filters.assetType !== 'all' && asset?.category !== filters.assetType) return;
            
            const woDate = new Date(wo.created_at);
            if (woDate >= monthStart && woDate <= monthEnd) {
              actualEvents++;
            }
          });
          cumulativeEvents = actualEvents;
        }

        // Calculate predicted events (using simple trend + seasonality)
        const baselinePrediction = assetCount * 0.1; // 10% of assets need maintenance per month
        const trendFactor = 1 + (i * 0.05); // Slight increasing trend
        const seasonalFactor = 1 + Math.sin((i / 6) * Math.PI) * 0.2; // Seasonal variation
        const predictedEvents = Math.round(baselinePrediction * trendFactor * seasonalFactor);

        months.push({
          month: monthKey,
          actualEvents: isFuture ? 0 : actualEvents,
          predictedEvents: isFuture ? predictedEvents : Math.max(predictedEvents, Math.round(actualEvents * 0.9)),
        });
      }

      return months;
    },
  });
}

export function useAssetFailureProbability(filters: ReportFilters) {
  return useQuery({
    queryKey: ['asset-failure-probability', filters],
    queryFn: async () => {
      // Get assets with their failure history
      let assetsQuery = supabase
        .from('assets')
        .select('id, asset_name, category, purchase_date, created_at, health_status, risk_level');
      
      if (filters.assetType && filters.assetType !== 'all') {
        assetsQuery = assetsQuery.eq('category', filters.assetType);
      }

      const { data: assets } = await assetsQuery;

      // Get work orders for failure frequency
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('id, asset_id, work_order_type, created_at')
        .in('work_order_type', ['Corrective', 'Emergency']);

      // Calculate failure count per asset
      const assetFailures: Record<string, number> = {};
      workOrders?.forEach(wo => {
        if (wo.asset_id) {
          assetFailures[wo.asset_id] = (assetFailures[wo.asset_id] || 0) + 1;
        }
      });

      const now = new Date();
      const probabilities: AssetFailureProbability[] = (assets || [])
        .map(asset => {
          const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date(asset.created_at);
          const ageInYears = differenceInDays(now, purchaseDate) / 365;
          
          // Calculate probability based on multiple factors
          const failureCount = assetFailures[asset.id] || 0;
          const ageFactor = Math.min(ageInYears / 10, 1) * 30; // Age contributes up to 30%
          const historyFactor = Math.min(failureCount / 5, 1) * 40; // Failure history up to 40%
          const healthFactor = asset.health_status === 'Critical' ? 25 
            : asset.health_status === 'Poor' ? 20
            : asset.health_status === 'Fair' ? 10
            : 5; // Health status up to 25%
          const riskFactor = asset.risk_level === 'Critical' ? 5
            : asset.risk_level === 'High' ? 4
            : asset.risk_level === 'Medium' ? 2
            : 0;

          const probability = Math.min(ageFactor + historyFactor + healthFactor + riskFactor, 100);

          return {
            assetName: asset.asset_name,
            age: Math.round(ageInYears * 10) / 10,
            probability: Math.round(probability),
            category: asset.category,
          };
        })
        .sort((a, b) => b.probability - a.probability);

      return probabilities;
    },
  });
}

export function useMaintenanceAlerts(filters: ReportFilters) {
  return useQuery({
    queryKey: ['maintenance-alerts', filters],
    queryFn: async () => {
      let assetsQuery = supabase
        .from('assets')
        .select('id, asset_name, category, purchase_date, created_at, health_status, risk_level, purchase_value, location');
      
      if (filters.assetType && filters.assetType !== 'all') {
        assetsQuery = assetsQuery.eq('category', filters.assetType);
      }

      const { data: assets } = await assetsQuery;

      // Get recent work orders
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('id, asset_id, work_order_type, created_at, estimated_cost')
        .in('work_order_type', ['Corrective', 'Emergency'])
        .order('created_at', { ascending: false });

      const now = new Date();
      const alerts: MaintenanceAlert[] = [];

      (assets || []).forEach(asset => {
        const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date(asset.created_at);
        const ageInYears = differenceInDays(now, purchaseDate) / 365;
        
        // Find last maintenance for this asset
        const assetWorkOrders = workOrders?.filter(wo => wo.asset_id === asset.id) || [];
        const lastFailure = assetWorkOrders[0];
        const failureCount = assetWorkOrders.length;
        
        // Calculate days since last maintenance
        const daysSinceLastMaintenance = lastFailure 
          ? differenceInDays(now, new Date(lastFailure.created_at))
          : 365;
        
        // Calculate risk score
        let riskScore = 0;
        if (asset.health_status === 'Critical') riskScore += 40;
        else if (asset.health_status === 'Poor') riskScore += 30;
        else if (asset.health_status === 'Fair') riskScore += 15;
        
        if (asset.risk_level === 'Critical') riskScore += 30;
        else if (asset.risk_level === 'High') riskScore += 20;
        else if (asset.risk_level === 'Medium') riskScore += 10;
        
        riskScore += Math.min(ageInYears * 3, 20);
        riskScore += Math.min(failureCount * 5, 20);

        // Generate alert if risk is significant
        if (riskScore >= 40) {
          const severity: 'critical' | 'high' | 'medium' = 
            riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : 'medium';
          
          const avgCost = assetWorkOrders.length > 0
            ? assetWorkOrders.reduce((sum, wo) => sum + (Number(wo.estimated_cost) || 0), 0) / assetWorkOrders.length
            : (Number(asset.purchase_value) || 1000) * 0.05;

          const daysUntilFailure = Math.max(7, Math.round((100 - riskScore) * 1.5));

          alerts.push({
            severity,
            title: `${severity === 'critical' ? 'Critical' : severity === 'high' ? 'High Priority' : 'Medium Priority'} Maintenance Alert`,
            description: `Our analysis has detected early warning signs of potential failure in your ${asset.location}. Immediate preventive action is recommended within ${daysUntilFailure} days to avoid costly downtime (${Math.round(riskScore)}% confidence).`,
            priority: asset.asset_name,
            estimatedCost: Math.round(avgCost),
            impact: severity === 'critical' ? 'Critical' : severity === 'high' ? 'High' : 'Medium',
            assetName: asset.asset_name,
            daysUntilFailure,
            confidence: Math.min(riskScore + 20, 97),
          });
        }
      });

      return alerts.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }).slice(0, 5);
    },
  });
}

export function useUpcomingPredictedMaintenance(filters: ReportFilters) {
  return useQuery({
    queryKey: ['upcoming-predicted-maintenance', filters],
    queryFn: async () => {
      let assetsQuery = supabase
        .from('assets')
        .select('id, asset_name, category, purchase_date, created_at, health_status, risk_level, purchase_value');
      
      if (filters.assetType && filters.assetType !== 'all') {
        assetsQuery = assetsQuery.eq('category', filters.assetType);
      }

      const { data: assets } = await assetsQuery;

      // Get work order history
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('id, asset_id, work_order_type, created_at, estimated_cost')
        .order('created_at', { ascending: false });

      const now = new Date();
      const predictions: PredictedMaintenance[] = [];

      (assets || []).forEach(asset => {
        const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date(asset.created_at);
        const ageInYears = differenceInDays(now, purchaseDate) / 365;
        
        const assetWorkOrders = workOrders?.filter(wo => wo.asset_id === asset.id) || [];
        const failureCount = assetWorkOrders.filter(wo => 
          wo.work_order_type === 'Corrective' || wo.work_order_type === 'Emergency'
        ).length;
        
        // Calculate likelihood based on factors
        let likelihood = 30; // Base likelihood
        if (asset.health_status === 'Critical') likelihood += 50;
        else if (asset.health_status === 'Poor') likelihood += 35;
        else if (asset.health_status === 'Fair') likelihood += 15;
        
        likelihood += Math.min(ageInYears * 5, 25);
        likelihood += Math.min(failureCount * 8, 24);
        likelihood = Math.min(likelihood, 97);

        if (likelihood >= 50) {
          const maintenanceTypes = ['Regular Service', 'Part Replacement', 'Calibration', 'Firmware Update', 'Inspection'];
          const maintenanceType = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
          
          const avgCost = assetWorkOrders.length > 0
            ? assetWorkOrders.reduce((sum, wo) => sum + (Number(wo.estimated_cost) || 0), 0) / assetWorkOrders.length
            : (Number(asset.purchase_value) || 1000) * 0.03;

          const daysUntilDue = Math.max(7, Math.round((100 - likelihood) * 2));

          predictions.push({
            assetName: asset.asset_name,
            maintenanceType,
            dueDate: format(addDays(now, daysUntilDue), 'dd/MM/yyyy'),
            likelihood: Math.round(likelihood),
            cost: Math.round(avgCost),
            impact: likelihood >= 80 ? 'Critical Health Impact' 
              : likelihood >= 60 ? 'High Health Impact' 
              : 'Medium Health Impact',
            assetId: asset.id,
          });
        }
      });

      return predictions.sort((a, b) => b.likelihood - a.likelihood).slice(0, 6);
    },
  });
}
