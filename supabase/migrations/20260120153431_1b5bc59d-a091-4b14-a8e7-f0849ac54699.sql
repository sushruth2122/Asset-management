-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create assets table
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_name TEXT NOT NULL,
    asset_code TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'Active',
    location TEXT NOT NULL DEFAULT '',
    purchase_date DATE,
    purchase_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create spare_parts table
CREATE TABLE public.spare_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_name TEXT NOT NULL,
    part_number TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = check_user_id
  LIMIT 1
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.is_admin());

-- User roles RLS policies
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.is_admin());

-- Allow inserting own role on signup (for default user role)
CREATE POLICY "Users can insert own role on signup"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id AND role = 'user');

-- Assets RLS policies - all authenticated users can read
CREATE POLICY "Authenticated users can view assets"
ON public.assets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert assets"
ON public.assets FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update assets"
ON public.assets FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete assets"
ON public.assets FOR DELETE
USING (public.is_admin());

-- Spare parts RLS policies
CREATE POLICY "Authenticated users can view spare parts"
ON public.spare_parts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert spare parts"
ON public.spare_parts FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update spare parts"
ON public.spare_parts FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete spare parts"
ON public.spare_parts FOR DELETE
USING (public.is_admin());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spare_parts_updated_at
BEFORE UPDATE ON public.spare_parts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
    
    -- Assign default 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create profile and role on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample assets for demo
INSERT INTO public.assets (asset_name, asset_code, category, status, location, purchase_date, purchase_value) VALUES
('Server Backup', 'SVR-001', 'Server Infrastructure', 'Active', 'Data Center A', '2023-01-15', 28000.00),
('Company Vehicle', 'VEH-001', 'Transportation', 'Active', 'Parking Lot B', '2023-03-20', 45000.00),
('Manufacturing Equipment', 'MFG-001', 'Manufacturing', 'Active', 'Factory Floor', '2022-11-10', 125000.00),
('Office Workstation', 'WS-001', 'Electronics', 'Active', 'Office Building A', '2023-06-01', 2500.00),
('Network Switch', 'NET-001', 'Electronics', 'Active', 'Data Center A', '2023-02-28', 8500.00),
('HVAC System', 'HVAC-001', 'Facilities', 'Maintenance', 'Building B', '2021-05-15', 35000.00),
('Forklift', 'FLT-001', 'Transportation', 'Active', 'Warehouse C', '2022-08-22', 55000.00),
('3D Printer', 'PRT-001', 'Electronics', 'Active', 'R&D Lab', '2023-04-10', 12000.00);

-- Insert sample spare parts
INSERT INTO public.spare_parts (part_name, part_number, quantity, asset_id) VALUES
('Server Fan', 'SF-001', 10, (SELECT id FROM public.assets WHERE asset_code = 'SVR-001')),
('Power Supply Unit', 'PSU-001', 5, (SELECT id FROM public.assets WHERE asset_code = 'SVR-001')),
('Vehicle Filter', 'VF-001', 20, (SELECT id FROM public.assets WHERE asset_code = 'VEH-001')),
('Brake Pads', 'BP-001', 8, (SELECT id FROM public.assets WHERE asset_code = 'VEH-001'));