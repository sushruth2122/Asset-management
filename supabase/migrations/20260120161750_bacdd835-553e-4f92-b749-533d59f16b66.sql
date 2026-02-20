-- Add GIS columns to assets table
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'Good',
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'Low';

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('maintenance', 'warranty', 'work_order', 'approval', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    read_status BOOLEAN NOT NULL DEFAULT false,
    related_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (is_admin());

-- Admins can delete any notification
CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
USING (is_admin());

-- Users can insert their own notifications (for system-generated ones)
CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample assets with geolocation data
INSERT INTO public.assets (asset_code, asset_name, category, status, location, purchase_value, latitude, longitude, health_status, risk_level)
VALUES 
    ('AST-001', 'Server Rack A1', 'IT Equipment', 'Active', 'Data Center 1', 45000, 40.7580, -73.9855, 'Excellent', 'Low'),
    ('AST-002', 'Industrial Generator', 'Equipment', 'Active', 'Building B', 125000, 34.0522, -118.2437, 'Good', 'Medium'),
    ('AST-003', 'HVAC Unit Central', 'Equipment', 'Maintenance', 'Main Building', 35000, 41.8781, -87.6298, 'Fair', 'High'),
    ('AST-004', 'Company Vehicle Ford', 'Vehicle', 'Active', 'Parking Lot A', 28000, 29.7604, -95.3698, 'Good', 'Low'),
    ('AST-005', 'Office Furniture Set', 'Furniture', 'Active', 'Floor 3', 8500, 47.6062, -122.3321, 'Excellent', 'Low')
ON CONFLICT (asset_code) DO NOTHING;