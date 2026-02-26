import React from 'react';
import { useStore, hasPermission } from '../store';

interface PermissionProps {
  permissions?: string[];
  roles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Permission: React.FC<PermissionProps> = ({ 
  permissions, 
  roles, 
  children, 
  fallback = null 
}) => {
  const { state } = useStore();
  const currentUser = state.user;
  
  const userRole = currentUser?.roleKey || currentUser?.role || 'viewer';
  const userPermissions = state.permissions || currentUser?.permissions || [];

  if (!currentUser) return <>{fallback}</>;

  if (roles && roles.length > 0) {
    if (!roles.includes(userRole)) {
      return <>{fallback}</>;
    }
  }

  if (permissions && permissions.length > 0) {
    const hasAny = permissions.some(p => hasPermission(userPermissions, p));
    if (!hasAny) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export const usePermission = (permission: string): boolean => {
  const { state } = useStore();
  const currentUser = state.user;
  const userPermissions = state.permissions || currentUser?.permissions || [];
  return hasPermission(userPermissions, permission);
};
