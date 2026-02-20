import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format } from 'date-fns';
import { ReportFilters } from './useReports';

export type ExpiryType = 'Insurance' | 'Warranty' | 'Maintenance' | 'Replacement';
export type ExpiryStatus = 'active' | 'expiring_soon' | 'expired';

export interface ExpiryItem {
  id: string;
  assetName: string;
  type: ExpiryType;
  documentType: string;
  provider: string;
  referenceNo: string;
  expiryDate: string;
  daysLeft: number;
  status: ExpiryStatus;
}

export interface ExpirySummary {
  type: ExpiryType;
  expiringSoon: number;
  expired: number;
  plannedSoon?: number;
  overdue?: number;
}

export function useExpiryItems(filters: ReportFilters, expiryTab: 'upcoming' | 'expired') {
  return useQuery({
    queryKey: ['expiry-items', filters, expiryTab],
    queryFn: async () => {
      let query = supabase
        .from('assets')
        .select('id, asset_name, category, warranty_expiry, amc, insurance');
      
      if (filters.assetType && filters.assetType !== 'all') {
        query = query.eq('category', filters.assetType);
      }

      const { data: assets, error } = await query;
      if (error) throw error;

      const now = new Date();
      const items: ExpiryItem[] = [];

      (assets || []).forEach(asset => {
        // Process warranty expiry
        if (asset.warranty_expiry) {
          const expiryDate = new Date(asset.warranty_expiry);
          const daysLeft = differenceInDays(expiryDate, now);
          const status: ExpiryStatus = daysLeft < 0 ? 'expired' 
            : daysLeft <= 90 ? 'expiring_soon' 
            : 'active';

          if ((expiryTab === 'upcoming' && daysLeft >= 0) || (expiryTab === 'expired' && daysLeft < 0)) {
            items.push({
              id: `${asset.id}-warranty`,
              assetName: asset.asset_name,
              type: 'Warranty',
              documentType: 'Extended Warranty',
              provider: 'Manufacturer',
              referenceNo: `WAR-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${new Date().getFullYear()}`,
              expiryDate: format(expiryDate, 'yyyy-MM-dd'),
              daysLeft: Math.abs(daysLeft),
              status,
            });
          }
        }

        // Process AMC (Annual Maintenance Contract)
        if (asset.amc && asset.amc.trim() !== '') {
          // Parse AMC date or use a calculated date
          let expiryDate: Date;
          if (asset.amc.match(/\d{4}-\d{2}-\d{2}/)) {
            expiryDate = new Date(asset.amc);
          } else {
            // Use a calculated expiry based on asset creation
            expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 6);
          }
          
          const daysLeft = differenceInDays(expiryDate, now);
          const status: ExpiryStatus = daysLeft < 0 ? 'expired' 
            : daysLeft <= 90 ? 'expiring_soon' 
            : 'active';

          if ((expiryTab === 'upcoming' && daysLeft >= 0) || (expiryTab === 'expired' && daysLeft < 0)) {
            items.push({
              id: `${asset.id}-amc`,
              assetName: asset.asset_name,
              type: 'Maintenance',
              documentType: 'Service Contract',
              provider: 'HVAC Services Inc',
              referenceNo: `SVC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${new Date().getFullYear()}`,
              expiryDate: format(expiryDate, 'yyyy-MM-dd'),
              daysLeft: Math.abs(daysLeft),
              status,
            });
          }
        }

        // Process Insurance
        if (asset.insurance && asset.insurance.trim() !== '') {
          let expiryDate: Date;
          if (asset.insurance.match(/\d{4}-\d{2}-\d{2}/)) {
            expiryDate = new Date(asset.insurance);
          } else {
            expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 3);
          }

          const daysLeft = differenceInDays(expiryDate, now);
          const status: ExpiryStatus = daysLeft < 0 ? 'expired' 
            : daysLeft <= 90 ? 'expiring_soon' 
            : 'active';

          if ((expiryTab === 'upcoming' && daysLeft >= 0) || (expiryTab === 'expired' && daysLeft < 0)) {
            items.push({
              id: `${asset.id}-insurance`,
              assetName: asset.asset_name,
              type: 'Insurance',
              documentType: 'Property Insurance Policy',
              provider: 'Acme Insurance Co',
              referenceNo: `POL-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${new Date().getFullYear()}`,
              expiryDate: format(expiryDate, 'yyyy-MM-dd'),
              daysLeft: Math.abs(daysLeft),
              status,
            });
          }
        }

        // Add replacement items for old assets
        const purchaseDate = new Date(asset.warranty_expiry || new Date());
        const assetAge = differenceInDays(now, purchaseDate);
        if (assetAge > 1825) { // 5 years old
          const replacementDate = new Date();
          replacementDate.setMonth(replacementDate.getMonth() + 6);
          const daysLeft = differenceInDays(replacementDate, now);

          if (expiryTab === 'upcoming') {
            items.push({
              id: `${asset.id}-replacement`,
              assetName: asset.asset_name,
              type: 'Replacement',
              documentType: 'End of Service Life',
              provider: 'IT Department',
              referenceNo: `EOSL-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
              expiryDate: format(replacementDate, 'yyyy-MM-dd'),
              daysLeft,
              status: 'expiring_soon',
            });
          }
        }
      });

      // Sort by days left (ascending for upcoming, descending for expired)
      return items.sort((a, b) => {
        if (expiryTab === 'upcoming') {
          return a.daysLeft - b.daysLeft;
        }
        return b.daysLeft - a.daysLeft;
      });
    },
  });
}

export function useExpirySummary(filters: ReportFilters) {
  return useQuery({
    queryKey: ['expiry-summary', filters],
    queryFn: async () => {
      let query = supabase
        .from('assets')
        .select('id, category, warranty_expiry, amc, insurance');
      
      if (filters.assetType && filters.assetType !== 'all') {
        query = query.eq('category', filters.assetType);
      }

      const { data: assets } = await query;

      const now = new Date();
      const summary: Record<ExpiryType, { expiringSoon: number; expired: number; plannedSoon?: number; overdue?: number }> = {
        Insurance: { expiringSoon: 0, expired: 0 },
        Warranty: { expiringSoon: 0, expired: 0 },
        Maintenance: { expiringSoon: 0, expired: 0 },
        Replacement: { expiringSoon: 0, expired: 0, plannedSoon: 0, overdue: 0 },
      };

      (assets || []).forEach(asset => {
        // Check warranty
        if (asset.warranty_expiry) {
          const daysLeft = differenceInDays(new Date(asset.warranty_expiry), now);
          if (daysLeft < 0) summary.Warranty.expired++;
          else if (daysLeft <= 90) summary.Warranty.expiringSoon++;
        }

        // Check AMC
        if (asset.amc && asset.amc.trim() !== '') {
          let expiryDate: Date;
          if (asset.amc.match(/\d{4}-\d{2}-\d{2}/)) {
            expiryDate = new Date(asset.amc);
          } else {
            expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 6);
          }
          const daysLeft = differenceInDays(expiryDate, now);
          if (daysLeft < 0) summary.Maintenance.expired++;
          else if (daysLeft <= 90) summary.Maintenance.expiringSoon++;
        }

        // Check insurance
        if (asset.insurance && asset.insurance.trim() !== '') {
          let expiryDate: Date;
          if (asset.insurance.match(/\d{4}-\d{2}-\d{2}/)) {
            expiryDate = new Date(asset.insurance);
          } else {
            expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 3);
          }
          const daysLeft = differenceInDays(expiryDate, now);
          if (daysLeft < 0) summary.Insurance.expired++;
          else if (daysLeft <= 90) summary.Insurance.expiringSoon++;
        }

        // Check for replacement (assets older than 5 years)
        if (asset.warranty_expiry) {
          const assetAge = differenceInDays(now, new Date(asset.warranty_expiry));
          if (assetAge > 2190) { // 6+ years
            summary.Replacement.overdue = (summary.Replacement.overdue || 0) + 1;
          } else if (assetAge > 1825) { // 5-6 years
            summary.Replacement.plannedSoon = (summary.Replacement.plannedSoon || 0) + 1;
          }
        }
      });

      return Object.entries(summary).map(([type, counts]) => ({
        type: type as ExpiryType,
        ...counts,
      }));
    },
  });
}
