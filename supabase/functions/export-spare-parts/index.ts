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

    console.log('Admin verified, fetching spare parts...');

    // Fetch all spare parts with asset info
    const { data: parts, error: fetchError } = await supabase
      .from('spare_parts')
      .select(`
        *,
        asset:assets(asset_name, asset_code)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.log('Error fetching spare parts:', fetchError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch spare parts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Exporting ${parts?.length || 0} spare parts`);

    // Generate CSV
    const headers = [
      'Part Name', 'Part Number', 'Description', 'Quantity', 'Status',
      'Minimum Threshold', 'Reorder Quantity', 'Unit Cost', 'Total Value',
      'Supplier', 'Storage Location', 'Warranty Days',
      'Linked Asset Name', 'Linked Asset Code',
      'Created At', 'Updated At'
    ];

    const csvRows = [headers.join(',')];

    for (const part of parts || []) {
      const totalValue = (part.quantity || 0) * (part.unit_cost || 0);
      const row = [
        escapeCSV(part.part_name),
        escapeCSV(part.part_number),
        escapeCSV(part.description),
        part.quantity?.toString() || '0',
        escapeCSV(part.status),
        part.minimum_threshold?.toString() || '0',
        part.reorder_quantity?.toString() || '0',
        part.unit_cost?.toString() || '0',
        totalValue.toString(),
        escapeCSV(part.supplier),
        escapeCSV(part.storage_location),
        part.warranty_days?.toString() || '0',
        escapeCSV(part.asset?.asset_name),
        escapeCSV(part.asset?.asset_code),
        escapeCSV(part.created_at),
        escapeCSV(part.updated_at)
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="spare_parts_export_${timestamp}.csv"`,
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
