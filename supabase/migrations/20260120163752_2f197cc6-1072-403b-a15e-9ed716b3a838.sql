-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create stricter SELECT policy: users see only their own, admins see all
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin());