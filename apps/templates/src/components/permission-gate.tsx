"use client";

import { ReactNode } from "react";
import { PermissionManager } from "@/lib/utils/permissions";

interface PermissionGateProps {
  userRole: string;
  children: ReactNode;
  fallback?: ReactNode;
  
  // Permission options (use one)
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // For permissions array - true = AND, false = OR
  
  // Resource/action options
  resource?: string;
  action?: string;
  
  // Role level options
  minRoleLevel?: number;
  allowedRoles?: string[];
  
  // Advanced options
  condition?: (manager: PermissionManager) => boolean;
  debug?: boolean;
}

export function PermissionGate({
  userRole,
  children,
  fallback = null,
  permission,
  permissions,
  requireAll = false,
  resource,
  action,
  minRoleLevel,
  allowedRoles,
  condition,
  debug = false
}: PermissionGateProps) {
  const manager = new PermissionManager(userRole);
  
  let hasAccess = false;
  let debugInfo = "";

  // Check specific permission
  if (permission) {
    hasAccess = manager.hasPermission(permission);
    if (debug) debugInfo = `Permission '${permission}': ${hasAccess}`;
  }
  
  // Check multiple permissions
  else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? manager.hasAllPermissions(permissions)
      : manager.hasAnyPermission(permissions);
    if (debug) debugInfo = `Permissions [${permissions.join(', ')}] (${requireAll ? 'ALL' : 'ANY'}): ${hasAccess}`;
  }
  
  // Check resource/action access
  else if (resource && action) {
    hasAccess = manager.canAccess(resource, action);
    if (debug) debugInfo = `Resource '${resource}' action '${action}': ${hasAccess}`;
  }
  
  // Check minimum role level
  else if (minRoleLevel !== undefined) {
    hasAccess = manager.hasRoleLevel(minRoleLevel);
    if (debug) debugInfo = `Min role level ${minRoleLevel} (current: ${manager.getRoleLevel()}): ${hasAccess}`;
  }
  
  // Check allowed roles
  else if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = allowedRoles.includes(userRole);
    if (debug) debugInfo = `Allowed roles [${allowedRoles.join(', ')}] (current: ${userRole}): ${hasAccess}`;
  }
  
  // Check custom condition
  else if (condition) {
    hasAccess = condition(manager);
    if (debug) debugInfo = `Custom condition: ${hasAccess}`;
  }
  
  // Default to true if no conditions specified
  else {
    hasAccess = true;
    if (debug) debugInfo = "No conditions specified, allowing access";
  }

  if (debug) {
    console.log(`[PermissionGate] ${debugInfo}`);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface ConditionalPermissionGateProps {
  userRole: string;
  children: ReactNode;
  showIf: (manager: PermissionManager) => boolean;
  fallback?: ReactNode;
}

export function ConditionalPermissionGate({
  userRole,
  children,
  showIf,
  fallback = null
}: ConditionalPermissionGateProps) {
  const manager = new PermissionManager(userRole);
  const hasAccess = showIf(manager);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface RoleBasedComponentProps {
  userRole: string;
  components: {
    [roleName: string]: ReactNode;
  };
  defaultComponent?: ReactNode;
}

export function RoleBasedComponent({
  userRole,
  components,
  defaultComponent = null
}: RoleBasedComponentProps) {
  // Try exact role match first
  if (components[userRole]) {
    return <>{components[userRole]}</>;
  }
  
  // Fall back to role level matching (highest level wins)
  const manager = new PermissionManager(userRole);
  const currentLevel = manager.getRoleLevel();
  
  const sortedRoles = Object.keys(components).sort((a, b) => {
    const aLevel = new PermissionManager(a).getRoleLevel();
    const bLevel = new PermissionManager(b).getRoleLevel();
    return bLevel - aLevel; // Descending order
  });
  
  for (const role of sortedRoles) {
    const roleLevel = new PermissionManager(role).getRoleLevel();
    if (currentLevel >= roleLevel) {
      return <>{components[role]}</>;
    }
  }
  
  return <>{defaultComponent}</>;
}

interface PermissionBoundaryProps {
  userRole: string;
  children: ReactNode;
  fallback?: ReactNode;
  onAccessDenied?: (reason: string) => void;
}

export function PermissionBoundary({
  userRole,
  children,
  fallback = (
    <div className="p-4 text-center text-muted-foreground">
      <p>You don't have permission to view this content.</p>
    </div>
  ),
  onAccessDenied
}: PermissionBoundaryProps) {
  try {
    return <>{children}</>;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown permission error';
    onAccessDenied?.(reason);
    return <>{fallback}</>;
  }
}

// Hook for permission checking in components
export function usePermissions(userRole: string) {
  const manager = new PermissionManager(userRole);
  
  return {
    hasPermission: (permission: string) => manager.hasPermission(permission),
    hasAnyPermission: (permissions: string[]) => manager.hasAnyPermission(permissions),
    hasAllPermissions: (permissions: string[]) => manager.hasAllPermissions(permissions),
    canAccess: (resource: string, action: string) => manager.canAccess(resource, action),
    getRoleLevel: () => manager.getRoleLevel(),
    hasRoleLevel: (level: number) => manager.hasRoleLevel(level),
    canManageUser: (targetRole: string) => manager.canManageUser(targetRole),
    getAllPermissions: () => manager.getAllPermissions(),
    getPermissionsByCategory: (category: string) => manager.getPermissionsByCategory(category),
    getResourcePermissions: (resource: string) => manager.getResourcePermissions(resource),
    checkPermission: (permission: string) => manager.checkPermission(permission),
    checkPermissions: (permissions: string[]) => manager.checkPermissions(permissions),
  };
}

// Higher-order component for permission wrapping
export function withPermissions<T extends object>(
  Component: React.ComponentType<T>,
  permissionCheck: {
    userRole: string;
    permission?: string;
    permissions?: string[];
    requireAll?: boolean;
    resource?: string;
    action?: string;
    minRoleLevel?: number;
    allowedRoles?: string[];
    condition?: (manager: PermissionManager) => boolean;
  },
  fallback?: ReactNode
) {
  return function PermissionWrappedComponent(props: T) {
    return (
      <PermissionGate {...permissionCheck} fallback={fallback}>
        <Component {...props} />
      </PermissionGate>
    );
  };
}

export default PermissionGate;