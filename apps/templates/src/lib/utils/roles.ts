import { mockRoles, mockPermissions, permissionUtils, type MockRole, type MockPermission } from "@/lib/mock/roles-mock";

/**
 * Role utility functions
 */
export const roleUtils = {
  /**
   * Get role by ID
   */
  getRole: (roleId: string): MockRole | undefined => {
    return mockRoles.find(role => role.id === roleId);
  },

  /**
   * Get all roles
   */
  getAllRoles: (): MockRole[] => {
    return mockRoles.slice().sort((a, b) => b.level - a.level);
  },

  /**
   * Get system roles only
   */
  getSystemRoles: (): MockRole[] => {
    return mockRoles.filter(role => role.isSystem).sort((a, b) => b.level - a.level);
  },

  /**
   * Get custom roles only
   */
  getCustomRoles: (): MockRole[] => {
    return mockRoles.filter(role => !role.isSystem).sort((a, b) => b.level - a.level);
  },

  /**
   * Get role permissions
   */
  getRolePermissions: (roleId: string): MockPermission[] => {
    const role = mockRoles.find(r => r.id === roleId);
    if (!role) return [];
    
    return mockPermissions.filter(permission => role.permissions.includes(permission.id));
  },

  /**
   * Get role permissions by category
   */
  getRolePermissionsByCategory: (roleId: string): Record<string, MockPermission[]> => {
    const permissions = roleUtils.getRolePermissions(roleId);
    
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, MockPermission[]>);
  },

  /**
   * Check if role has specific permission
   */
  roleHasPermission: (roleId: string, permissionId: string): boolean => {
    const role = mockRoles.find(r => r.id === roleId);
    return role ? role.permissions.includes(permissionId) : false;
  },

  /**
   * Get roles that have a specific permission
   */
  getRolesWithPermission: (permissionId: string): MockRole[] => {
    return mockRoles.filter(role => role.permissions.includes(permissionId));
  },

  /**
   * Get role hierarchy (roles that can manage this role)
   */
  getRoleHierarchy: (roleId: string): MockRole[] => {
    const role = mockRoles.find(r => r.id === roleId);
    if (!role) return [];
    
    return mockRoles.filter(r => r.level > role.level).sort((a, b) => b.level - a.level);
  },

  /**
   * Get roles that this role can manage
   */
  getManageableRoles: (roleId: string): MockRole[] => {
    const role = mockRoles.find(r => r.id === roleId);
    if (!role) return [];
    
    return mockRoles.filter(r => r.level < role.level).sort((a, b) => b.level - a.level);
  },

  /**
   * Check if one role can manage another
   */
  canManageRole: (managerRoleId: string, targetRoleId: string): boolean => {
    const managerRole = mockRoles.find(r => r.id === managerRoleId);
    const targetRole = mockRoles.find(r => r.id === targetRoleId);
    
    if (!managerRole || !targetRole) return false;
    
    return managerRole.level > targetRole.level || 
           (managerRole.level === targetRole.level && managerRole.permissions.includes('roles.manage'));
  },

  /**
   * Get role color class
   */
  getRoleColor: (roleId: string): string => {
    const role = mockRoles.find(r => r.id === roleId);
    return role?.color || 'bg-gray-500';
  },

  /**
   * Get role icon
   */
  getRoleIcon: (roleId: string): any => {
    const role = mockRoles.find(r => r.id === roleId);
    return role?.icon;
  },

  /**
   * Format role name for display
   */
  formatRoleName: (roleId: string): string => {
    const role = mockRoles.find(r => r.id === roleId);
    return role?.name || 'Unknown Role';
  },

  /**
   * Get role description
   */
  getRoleDescription: (roleId: string): string => {
    const role = mockRoles.find(r => r.id === roleId);
    return role?.description || '';
  },

  /**
   * Check if role exists
   */
  roleExists: (roleId: string): boolean => {
    return mockRoles.some(role => role.id === roleId);
  },

  /**
   * Validate role permissions
   */
  validateRolePermissions: (permissions: string[]): { valid: boolean; invalidPermissions: string[] } => {
    const validPermissionIds = mockPermissions.map(p => p.id);
    const invalidPermissions = permissions.filter(p => !validPermissionIds.includes(p));
    
    return {
      valid: invalidPermissions.length === 0,
      invalidPermissions
    };
  },

  /**
   * Get permission suggestions for a role level
   */
  getPermissionSuggestions: (roleLevel: number): MockPermission[] => {
    // Suggest permissions based on role level
    if (roleLevel >= 90) {
      // Admin level - most permissions except system settings
      return mockPermissions.filter(p => !['system.settings', 'roles.manage'].includes(p.id));
    } else if (roleLevel >= 50) {
      // Member level - basic CRUD permissions
      return mockPermissions.filter(p => 
        ['create', 'read', 'update'].includes(p.action) && 
        !p.id.includes('system') && 
        !p.id.includes('roles') && 
        !p.id.includes('teams')
      );
    } else if (roleLevel >= 25) {
      // Viewer level - read-only permissions
      return mockPermissions.filter(p => p.action === 'read');
    } else {
      // Guest level - basic read permissions
      return mockPermissions.filter(p => 
        p.action === 'read' && 
        ['customers', 'invoices', 'reports'].includes(p.resource)
      );
    }
  },

  /**
   * Compare roles by level
   */
  compareRoles: (roleId1: string, roleId2: string): number => {
    const role1 = mockRoles.find(r => r.id === roleId1);
    const role2 = mockRoles.find(r => r.id === roleId2);
    
    if (!role1 || !role2) return 0;
    
    return role2.level - role1.level; // Descending order (higher level first)
  },

  /**
   * Get role statistics
   */
  getRoleStats: (roleId: string) => {
    const role = mockRoles.find(r => r.id === roleId);
    if (!role) return null;

    const totalPermissions = mockPermissions.length;
    const rolePermissions = role.permissions.length;
    const permissionsByCategory = roleUtils.getRolePermissionsByCategory(roleId);
    
    return {
      totalPermissions: rolePermissions,
      permissionCoverage: (rolePermissions / totalPermissions) * 100,
      categoriesWithAccess: Object.keys(permissionsByCategory).length,
      totalCategories: [...new Set(mockPermissions.map(p => p.category))].length,
      level: role.level,
      isSystem: role.isSystem,
      permissionsByCategory: Object.entries(permissionsByCategory).map(([category, perms]) => ({
        category,
        count: perms.length,
        permissions: perms.map(p => p.name)
      }))
    };
  },

  /**
   * Get roles for dropdown/select components
   */
  getRolesForSelect: (currentUserRole?: string) => {
    let availableRoles = mockRoles;
    
    // Filter roles based on current user's role
    if (currentUserRole) {
      const currentRole = mockRoles.find(r => r.id === currentUserRole);
      if (currentRole) {
        // Can only assign roles with lower or equal level
        availableRoles = mockRoles.filter(r => r.level <= currentRole.level);
      }
    }
    
    return availableRoles
      .sort((a, b) => b.level - a.level)
      .map(role => ({
        value: role.id,
        label: role.name,
        description: role.description,
        level: role.level,
        color: role.color,
        disabled: false
      }));
  },

  /**
   * Get default role for new users
   */
  getDefaultRole: (): MockRole => {
    return mockRoles.find(role => role.id === 'member') || mockRoles[0];
  },

  /**
   * Check if role name is unique
   */
  isRoleNameUnique: (name: string, excludeId?: string): boolean => {
    return !mockRoles.some(role => 
      role.name.toLowerCase() === name.toLowerCase() && 
      role.id !== excludeId
    );
  }
};

/**
 * Permission category utilities
 */
export const permissionCategories = {
  /**
   * Get all permission categories
   */
  getAllCategories: (): string[] => {
    return [...new Set(mockPermissions.map(p => p.category))].sort();
  },

  /**
   * Get permissions by category
   */
  getPermissionsByCategory: (category: string): MockPermission[] => {
    return mockPermissions.filter(p => p.category === category);
  },

  /**
   * Get category statistics
   */
  getCategoryStats: () => {
    const categories = permissionCategories.getAllCategories();
    
    return categories.map(category => {
      const permissions = permissionCategories.getPermissionsByCategory(category);
      const actions = [...new Set(permissions.map(p => p.action))];
      
      return {
        name: category,
        permissionCount: permissions.length,
        actions,
        resources: [...new Set(permissions.map(p => p.resource))]
      };
    });
  }
};

/**
 * Role validation utilities
 */
export const roleValidation = {
  /**
   * Validate role data
   */
  validateRole: (roleData: Partial<MockRole>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!roleData.name || roleData.name.trim().length === 0) {
      errors.push('Role name is required');
    }
    
    if (roleData.name && roleData.name.length > 50) {
      errors.push('Role name must be 50 characters or less');
    }
    
    if (roleData.name && !roleUtils.isRoleNameUnique(roleData.name, roleData.id)) {
      errors.push('Role name must be unique');
    }
    
    if (!roleData.description || roleData.description.trim().length === 0) {
      errors.push('Role description is required');
    }
    
    if (roleData.level !== undefined && (roleData.level < 1 || roleData.level > 100)) {
      errors.push('Role level must be between 1 and 100');
    }
    
    if (roleData.permissions) {
      const validation = roleUtils.validateRolePermissions(roleData.permissions);
      if (!validation.valid) {
        errors.push(`Invalid permissions: ${validation.invalidPermissions.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};

export default roleUtils;