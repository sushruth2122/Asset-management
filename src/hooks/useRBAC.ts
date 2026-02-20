import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'user';

interface RBACConfig {
  allowedRoles: AppRole[];
  redirectTo?: string;
  showError?: boolean;
}

/**
 * Hook for role-based access control checks
 * Provides utilities to verify user permissions before actions
 */
export function useRBAC() {
  const { role, user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = role === 'admin';
  const isUser = role === 'user';
  const isAuthenticated = !!user;

  /**
   * Check if user has one of the allowed roles
   */
  const hasRole = useCallback((allowedRoles: AppRole[]): boolean => {
    if (!role) return false;
    return allowedRoles.includes(role);
  }, [role]);

  /**
   * Check if user can perform an admin-only action
   * Returns true if user is admin, false otherwise
   */
  const canPerformAdminAction = useCallback((): boolean => {
    return isAdmin;
  }, [isAdmin]);

  /**
   * Guard function for admin-only operations
   * Shows error toast and optionally redirects if unauthorized
   */
  const requireAdmin = useCallback((config?: { redirect?: boolean; message?: string }): boolean => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to perform this action');
      if (config?.redirect) {
        navigate('/auth');
      }
      return false;
    }

    if (!isAdmin) {
      toast.error(config?.message || 'You do not have permission to perform this action');
      if (config?.redirect) {
        navigate('/dashboard');
      }
      return false;
    }

    return true;
  }, [isAuthenticated, isAdmin, navigate]);

  /**
   * Guard function for authenticated operations
   * Shows error toast and optionally redirects if unauthorized
   */
  const requireAuth = useCallback((config?: { redirect?: boolean; message?: string }): boolean => {
    if (!isAuthenticated) {
      toast.error(config?.message || 'You must be logged in to perform this action');
      if (config?.redirect) {
        navigate('/auth');
      }
      return false;
    }
    return true;
  }, [isAuthenticated, navigate]);

  /**
   * Parse RLS policy error messages to provide user-friendly feedback
   */
  const handleRLSError = useCallback((error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('row-level security') || message.includes('rls') || message.includes('policy')) {
      return 'You do not have permission to perform this action';
    }
    
    if (message.includes('not authenticated') || message.includes('jwt')) {
      return 'Your session has expired. Please log in again.';
    }

    if (message.includes('duplicate') || message.includes('unique')) {
      return 'A record with this identifier already exists';
    }

    return error.message;
  }, []);

  return {
    role,
    isAdmin,
    isUser,
    isAuthenticated,
    hasRole,
    canPerformAdminAction,
    requireAdmin,
    requireAuth,
    handleRLSError,
  };
}

/**
 * Higher-order function to wrap async operations with role checks
 */
export function withAdminCheck<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  isAdmin: boolean,
  errorMessage = 'Admin access required'
): T {
  return (async (...args: Parameters<T>) => {
    if (!isAdmin) {
      throw new Error(errorMessage);
    }
    return fn(...args);
  }) as T;
}
