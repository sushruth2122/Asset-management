-- Add foreign key constraint for assigned_to to profiles table
ALTER TABLE public.work_orders
ADD CONSTRAINT work_orders_assigned_to_fkey
FOREIGN KEY (assigned_to) REFERENCES public.profiles(user_id) ON DELETE SET NULL;