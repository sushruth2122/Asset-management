-- Drop existing restrictive policies for assets
DROP POLICY IF EXISTS "Admins can insert assets" ON public.assets;
DROP POLICY IF EXISTS "Admins can update assets" ON public.assets;
DROP POLICY IF EXISTS "Admins can delete assets" ON public.assets;

-- Create new policies allowing all authenticated users to manage assets
CREATE POLICY "Authenticated users can insert assets" 
ON public.assets 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update assets" 
ON public.assets 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete assets" 
ON public.assets 
FOR DELETE 
TO authenticated
USING (true);

-- Drop existing restrictive policies for spare_parts
DROP POLICY IF EXISTS "Admins can insert spare parts" ON public.spare_parts;
DROP POLICY IF EXISTS "Admins can update spare parts" ON public.spare_parts;
DROP POLICY IF EXISTS "Admins can delete spare parts" ON public.spare_parts;

-- Create new policies allowing all authenticated users to manage spare parts
CREATE POLICY "Authenticated users can insert spare parts" 
ON public.spare_parts 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update spare parts" 
ON public.spare_parts 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete spare parts" 
ON public.spare_parts 
FOR DELETE 
TO authenticated
USING (true);

-- Drop existing restrictive policies for work_orders
DROP POLICY IF EXISTS "Admins can insert work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Admins can update work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Admins can delete work orders" ON public.work_orders;

-- Create new policies allowing all authenticated users to manage work orders
CREATE POLICY "Authenticated users can insert work orders" 
ON public.work_orders 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update work orders" 
ON public.work_orders 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete work orders" 
ON public.work_orders 
FOR DELETE 
TO authenticated
USING (true);

-- Update SELECT policy for work_orders to allow all authenticated users to view
DROP POLICY IF EXISTS "Admins can view all work orders" ON public.work_orders;
DROP POLICY IF EXISTS "Users can view assigned work orders" ON public.work_orders;

CREATE POLICY "Authenticated users can view all work orders" 
ON public.work_orders 
FOR SELECT 
TO authenticated
USING (true);