import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export async function exportAssetsCSV(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error('You must be logged in to export data');
      return;
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/export-assets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Export failed with status ${response.status}`);
    }

    // Get the CSV content and trigger download
    const csvContent = await response.text();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    a.download = filenameMatch ? filenameMatch[1] : `assets_export_${new Date().toISOString().split('T')[0]}.csv`;
    
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('Assets exported successfully');
  } catch (error) {
    console.error('Export error:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to export assets');
  }
}

export async function exportSparePartsCSV(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error('You must be logged in to export data');
      return;
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/export-spare-parts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Export failed with status ${response.status}`);
    }

    // Get the CSV content and trigger download
    const csvContent = await response.text();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    a.download = filenameMatch ? filenameMatch[1] : `spare_parts_export_${new Date().toISOString().split('T')[0]}.csv`;
    
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('Spare parts exported successfully');
  } catch (error) {
    console.error('Export error:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to export spare parts');
  }
}
