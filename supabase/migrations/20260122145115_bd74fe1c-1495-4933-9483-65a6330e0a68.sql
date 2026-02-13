-- Create work order status enum
CREATE TYPE public.work_order_status AS ENUM ('Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled');

-- Create work order priority enum
CREATE TYPE public.work_order_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- Create work order type enum
CREATE TYPE public.work_order_type AS ENUM ('Preventive', 'Corrective', 'Inspection', 'Warranty', 'Emergency');

-- Create work_orders table
CREATE TABLE public.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    priority work_order_priority NOT NULL DEFAULT 'Medium',
    status work_order_status NOT NULL DEFAULT 'Open',
    work_order_type work_order_type DEFAULT 'Corrective',
    assigned_to UUID,
    created_by UUID NOT NULL,
    due_date DATE,
    estimated_cost NUMERIC(10,2),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can do everything
CREATE POLICY "Admins can view all work orders"
ON public.work_orders FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert work orders"
ON public.work_orders FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update work orders"
ON public.work_orders FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete work orders"
ON public.work_orders FOR DELETE
USING (is_admin());

-- Users can view work orders assigned to them
CREATE POLICY "Users can view assigned work orders"
ON public.work_orders FOR SELECT
USING (assigned_to = auth.uid());

-- Users can update status of work orders assigned to them
CREATE POLICY "Users can update assigned work orders status"
ON public.work_orders FOR UPDATE
USING (assigned_to = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_work_orders_updated_at
BEFORE UPDATE ON public.work_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate work order number
CREATE OR REPLACE FUNCTION public.generate_work_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    year_prefix TEXT;
    next_number INTEGER;
BEGIN
    year_prefix := 'WO-' || to_char(now(), 'YYYY') || '-';
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(work_order_number FROM 'WO-\d{4}-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO next_number
    FROM public.work_orders
    WHERE work_order_number LIKE year_prefix || '%';
    
    NEW.work_order_number := year_prefix || LPAD(next_number::TEXT, 3, '0');
    RETURN NEW;
END;
$$;

-- Trigger to auto-generate work order number
CREATE TRIGGER generate_work_order_number_trigger
BEFORE INSERT ON public.work_orders
FOR EACH ROW
WHEN (NEW.work_order_number IS NULL OR NEW.work_order_number = '')
EXECUTE FUNCTION public.generate_work_order_number();

-- Function to auto-create work order when asset health becomes Poor/Critical
CREATE OR REPLACE FUNCTION public.auto_create_work_order_on_asset_health()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_priority work_order_priority;
    admin_user_id UUID;
BEGIN
    -- Only trigger when health_status changes to Poor or Critical
    IF (NEW.health_status IN ('Poor', 'Critical') AND 
        (OLD.health_status IS NULL OR OLD.health_status NOT IN ('Poor', 'Critical'))) THEN
        
        -- Set priority based on risk level
        IF NEW.risk_level = 'Critical' OR NEW.health_status = 'Critical' THEN
            new_priority := 'Critical';
        ELSIF NEW.risk_level = 'High' THEN
            new_priority := 'High';
        ELSIF NEW.risk_level = 'Medium' THEN
            new_priority := 'Medium';
        ELSE
            new_priority := 'Low';
        END IF;
        
        -- Get first admin user as creator
        SELECT user_id INTO admin_user_id
        FROM public.user_roles
        WHERE role = 'admin'
        LIMIT 1;
        
        -- Create work order if admin exists
        IF admin_user_id IS NOT NULL THEN
            INSERT INTO public.work_orders (
                title,
                description,
                asset_id,
                priority,
                status,
                work_order_type,
                created_by,
                due_date
            ) VALUES (
                'Health Alert: ' || NEW.asset_name,
                'Automated work order created due to asset health status changing to ' || NEW.health_status || '. Asset: ' || NEW.asset_name || ' (' || NEW.asset_code || '). Please investigate and repair.',
                NEW.id,
                new_priority,
                'Open',
                'Corrective',
                admin_user_id,
                CURRENT_DATE + INTERVAL '7 days'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger on assets table for auto work order creation
CREATE TRIGGER auto_create_work_order_trigger
AFTER UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_work_order_on_asset_health();