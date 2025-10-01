import { mockRoles, mockPermissions, permissionUtils } from "@/lib/mock/roles-mock";

export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
}

export class PermissionManager {
  private userRole: string;
  private userPermissions: string[];

  constructor(userRole: string = 'guest') {
    this.userRole = userRole;
    this.userPermissions = permissionUtils.getUserPermissions(userRole);
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    return permissionUtils.hasPermission(this.userPermissions, permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissionUtils.hasAnyPermission(this.userPermissions, permissions);
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissionUtils.hasAllPermissions(this.userPermissions, permissions);
  }

  /**
   * Check if user can access a resource with a specific action
   */
  canAccess(resource: string, action: string): boolean {
    return permissionUtils.canAccess(this.userRole, resource, action);
  }

  /**
   * Get detailed permission check with reason
   */
  checkPermission(permission: string): PermissionCheck {
    const hasPermission = this.hasPermission(permission);
    
    return {
      hasPermission,
      reason: hasPermission 
        ? undefined 
        : `Missing permission: ${permission}. Required role level: ${this.getRequiredRoleLevel(permission)}`
    };
  }

  /**
   * Check multiple permissions and return detailed results
   */
  checkPermissions(permissions: string[]): Record<string, PermissionCheck> {
    return permissions.reduce((acc, permission) => {
      acc[permission] = this.checkPermission(permission);
      return acc;
    }, {} as Record<string, PermissionCheck>);
  }

  /**
   * Get user's role level
   */
  getRoleLevel(): number {
    return permissionUtils.getRoleLevel(this.userRole);
  }

  /**
   * Check if user has higher or equal role level than required
   */
  hasRoleLevel(requiredLevel: number): boolean {
    return this.getRoleLevel() >= requiredLevel;
  }

  /**
   * Get all user permissions
   */
  getAllPermissions(): string[] {
    return [...this.userPermissions];
  }

  /**
   * Get permissions by category
   */
  getPermissionsByCategory(category: string): string[] {
    return mockPermissions
      .filter(p => p.category === category && this.hasPermission(p.id))
      .map(p => p.id);
  }

  /**
   * Check if user can perform CRUD operations on a resource
   */
  getResourcePermissions(resource: string) {
    const actions = ['create', 'read', 'update', 'delete', 'manage'];
    return actions.reduce((acc, action) => {
      acc[action] = this.canAccess(resource, action);
      return acc;
    }, {} as Record<string, boolean>);
  }

  /**
   * Get required role level for a permission
   */
  private getRequiredRoleLevel(permission: string): number {
    // Find the lowest role level that has this permission
    const rolesWithPermission = mockRoles
      .filter(role => role.permissions.includes(permission))
      .sort((a, b) => a.level - b.level);
    
    return rolesWithPermission.length > 0 ? rolesWithPermission[0].level : 100;
  }

  /**
   * Update user role and refresh permissions
   */
  updateRole(newRole: string): void {
    this.userRole = newRole;
    this.userPermissions = permissionUtils.getUserPermissions(newRole);
  }

  /**
   * Check if user can manage other users (based on role hierarchy)
   */
  canManageUser(targetUserRole: string): boolean {
    const currentLevel = this.getRoleLevel();
    const targetLevel = permissionUtils.getRoleLevel(targetUserRole);
    
    // Can manage users with lower role level, or same level if has users.manage permission
    return currentLevel > targetLevel || 
           (currentLevel === targetLevel && this.hasPermission('users.manage'));
  }
}

/**
 * Helper functions for common permission checks
 */
export const permissions = {
  // Customer permissions
  canCreateCustomers: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('customers', 'create'),
  
  canViewCustomers: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('customers', 'read'),
  
  canEditCustomers: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('customers', 'update'),
  
  canDeleteCustomers: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('customers', 'delete'),

  // Invoice permissions
  canCreateInvoices: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('invoices', 'create'),
  
  canViewInvoices: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('invoices', 'read'),
  
  canEditInvoices: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('invoices', 'update'),
  
  canDeleteInvoices: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('invoices', 'delete'),

  // Transaction permissions
  canCreateTransactions: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('transactions', 'create'),
  
  canViewTransactions: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('transactions', 'read'),
  
  canEditTransactions: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('transactions', 'update'),
  
  canDeleteTransactions: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('transactions', 'delete'),

  // Database permissions
  canViewDatabase: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('database', 'read'),
  
  canManageDatabase: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('database', 'manage'),

  // Document permissions
  canCreateDocuments: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('documents', 'create'),
  
  canViewDocuments: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('documents', 'read'),

  // Report permissions
  canViewReports: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('reports', 'read'),
  
  canCreateReports: (userRole: string): boolean => 
    new PermissionManager(userRole).canAccess('reports', 'create'),

  // System permissions
  canManageRoles: (userRole: string): boolean => 
    new PermissionManager(userRole).hasPermission('roles.manage'),
  
  canManageTeams: (userRole: string): boolean => 
    new PermissionManager(userRole).hasPermission('teams.manage'),
  
  canManageUsers: (userRole: string): boolean => 
    new PermissionManager(userRole).hasPermission('users.manage'),
  
  canManageSettings: (userRole: string): boolean => 
    new PermissionManager(userRole).hasPermission('system.settings'),
};

/**
 * Get permission manager instance for a user role
 */
export const getPermissionManager = (userRole: string): PermissionManager => {
  return new PermissionManager(userRole);
};

/**
 * Create a permission checker function for React components
 */
export const createPermissionChecker = (userRole: string) => {
  const manager = new PermissionManager(userRole);
  
  return {
    hasPermission: (permission: string) => manager.hasPermission(permission),
    hasAnyPermission: (permissions: string[]) => manager.hasAnyPermission(permissions),
    hasAllPermissions: (permissions: string[]) => manager.hasAllPermissions(permissions),
    canAccess: (resource: string, action: string) => manager.canAccess(resource, action),
    getRoleLevel: () => manager.getRoleLevel(),
    hasRoleLevel: (level: number) => manager.hasRoleLevel(level),
    canManageUser: (targetRole: string) => manager.canManageUser(targetRole),
  };
};

export default PermissionManager;