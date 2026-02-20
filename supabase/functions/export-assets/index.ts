import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('User authentication failed:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Check if user is admin using the is_admin function
    const { data: isAdminResult, error: roleError } = await supabase.rpc('is_admin');
    
    if (roleError) {
      console.log('Error checking admin status:', roleError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdminResult) {
      console.log('User is not admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verified, fetching assets...');

    // Fetch all assets
    const { data: assets, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.log('Error fetching assets:', fetchError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch assets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Exporting ${assets?.length || 0} assets`);

    // Generate CSV
    const headers = [
      'Asset Name', 'Asset Code', 'Category', 'Status', 'Location', 
      'Building No', 'Custodian', 'Manufacturer', 'Model', 'Serial Number',
      'Asset Type', 'Specification', 'Voltage', 'Wattage',
      'Purchase Date', 'Purchase Value', 'Warranty Expiry',
      'Depreciation', 'Insurance', 'AMC', 'Lease Status',
      'Created At', 'Updated At'
    ];

    const csvRows = [headers.join(',')];

    for (const asset of assets || []) {
      const row = [
        escapeCSV(asset.asset_name),
        escapeCSV(asset.asset_code),
        escapeCSV(asset.category),
        escapeCSV(asset.status),
        escapeCSV(asset.location),
        escapeCSV(asset.building_no),
        escapeCSV(asset.custodian),
        escapeCSV(asset.manufacturer),
        escapeCSV(asset.model),
        escapeCSV(asset.serial_number),
        escapeCSV(asset.asset_type),
        escapeCSV(asset.specification),
        escapeCSV(asset.voltage),
        escapeCSV(asset.wattage),
        escapeCSV(asset.purchase_date),
        asset.purchase_value?.toString() || '0',
        escapeCSV(asset.warranty_expiry),
        escapeCSV(asset.depreciation),
        escapeCSV(asset.insurance),
        escapeCSV(asset.amc),
        escapeCSV(asset.lease_status),
        escapeCSV(asset.created_at),
        escapeCSV(asset.updated_at)
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="assets_export_${timestamp}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
