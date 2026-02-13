import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Show unauthorized message when role doesn't match
  useEffect(() => {
    if (!loading && user && requiredRole === 'admin' && role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
    }
  }, [loading, user, role, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - redirect to auth page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Role check for admin-only routes
  if (requiredRole === 'admin' && role !== 'admin') {
    // Redirect non-admin users to their dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
