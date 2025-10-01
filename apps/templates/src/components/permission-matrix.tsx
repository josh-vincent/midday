"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Checkbox } from "@midday/ui/checkbox";
import { Switch } from "@midday/ui/switch";
import { cn } from "@midday/ui/cn";
import { 
  Check, 
  X, 
  Search,
  Filter,
  Eye,
  EyeOff,
  RotateCcw
} from "lucide-react";
import { mockRoles, mockPermissions, type MockRole, type MockPermission } from "@/lib/mock/roles-mock";
import { roleUtils } from "@/lib/utils/roles";
import RoleBadge from "./role-badge";

interface PermissionMatrixProps {
  roles?: MockRole[];
  permissions?: MockPermission[];
  onPermissionChange?: (roleId: string, permissionId: string, granted: boolean) => void;
  readOnly?: boolean;
  showLegend?: boolean;
  compact?: boolean;
  className?: string;
}

export function PermissionMatrix({
  roles = mockRoles,
  permissions = mockPermissions,
  onPermissionChange,
  readOnly = false,
  showLegend = true,
  compact = false,
  className
}: PermissionMatrixProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [showSystemRoles, setShowSystemRoles] = useState(true);

  // Get unique categories and actions
  const categories = [...new Set(permissions.map(p => p.category))].sort();
  const actions = [...new Set(permissions.map(p => p.action))].sort();

  // Filter permissions
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = !searchQuery || 
      permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.resource.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(permission.category);
    
    const matchesAction = selectedActions.length === 0 || 
      selectedActions.includes(permission.action);
    
    return matchesSearch && matchesCategory && matchesAction;
  });

  // Filter roles
  const filteredRoles = roles.filter(role => 
    showSystemRoles || !role.isSystem
  ).sort((a, b) => b.level - a.level);

  // Group permissions by category
  const permissionsByCategory = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, MockPermission[]>);

  const hasPermission = (roleId: string, permissionId: string) => {
    return roleUtils.roleHasPermission(roleId, permissionId);
  };

  const handlePermissionToggle = (roleId: string, permissionId: string) => {
    if (readOnly) return;
    
    const currentValue = hasPermission(roleId, permissionId);
    onPermissionChange?.(roleId, permissionId, !currentValue);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedActions([]);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleAction = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action) 
        ? prev.filter(a => a !== action)
        : [...prev, action]
    );
  };

  if (compact) {
    return (
      <CompactPermissionMatrix
        roles={filteredRoles}
        permissions={filteredPermissions}
        onPermissionChange={onPermissionChange}
        readOnly={readOnly}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Categories */}
            <div>
              <label className="text-sm font-medium mb-2 block">Categories</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {categories.map(category => (
                  <label key={category} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <label className="text-sm font-medium mb-2 block">Actions</label>
              <div className="space-y-2">
                {actions.map(action => (
                  <label key={action} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedActions.includes(action)}
                      onCheckedChange={() => toggleAction(action)}
                    />
                    <span className="text-sm capitalize">{action}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="text-sm font-medium mb-2 block">Options</label>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm">Show System Roles</span>
                  <Switch
                    checked={showSystemRoles}
                    onCheckedChange={setShowSystemRoles}
                  />
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      {showLegend && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm">Has Permission</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border-2 border-muted-foreground/20 flex items-center justify-center">
                  <X className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm">No Permission</span>
              </div>
              {!readOnly && (
                <div className="text-sm text-muted-foreground">
                  Click to toggle permissions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matrix */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Permission
                </th>
                {filteredRoles.map(role => (
                  <th key={role.id} className="h-12 px-4 text-center align-middle font-medium">
                    <RoleBadge roleId={role.id} size="sm" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                <PermissionCategorySection
                  key={category}
                  category={category}
                  permissions={categoryPermissions}
                  roles={filteredRoles}
                  onPermissionToggle={handlePermissionToggle}
                  readOnly={readOnly}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Showing {filteredPermissions.length} of {permissions.length} permissions 
            across {filteredRoles.length} roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredRoles.map(role => {
              const rolePermissions = filteredPermissions.filter(p => 
                hasPermission(role.id, p.id)
              );
              const percentage = filteredPermissions.length > 0 
                ? (rolePermissions.length / filteredPermissions.length) * 100 
                : 0;

              return (
                <div key={role.id} className="text-center">
                  <RoleBadge roleId={role.id} size="sm" className="mb-2" />
                  <div className="text-2xl font-bold">{rolePermissions.length}</div>
                  <div className="text-sm text-muted-foreground">
                    {percentage.toFixed(0)}% coverage
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface PermissionCategorySectionProps {
  category: string;
  permissions: MockPermission[];
  roles: MockRole[];
  onPermissionToggle: (roleId: string, permissionId: string) => void;
  readOnly: boolean;
}

function PermissionCategorySection({
  category,
  permissions,
  roles,
  onPermissionToggle,
  readOnly
}: PermissionCategorySectionProps) {
  return (
    <>
      <tr className="border-b bg-muted/30">
        <td colSpan={roles.length + 1} className="px-4 py-3 font-medium">
          <Badge variant="outline">{category}</Badge>
        </td>
      </tr>
      {permissions.map(permission => (
        <tr key={permission.id} className="border-b hover:bg-muted/50">
          <td className="px-4 py-3">
            <div>
              <div className="font-medium">{permission.name}</div>
              <div className="text-sm text-muted-foreground">
                {permission.description}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {permission.resource}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {permission.action}
                </Badge>
              </div>
            </div>
          </td>
          {roles.map(role => {
            const hasAccess = roleUtils.roleHasPermission(role.id, permission.id);
            return (
              <td key={role.id} className="px-4 py-3 text-center">
                <button
                  onClick={() => onPermissionToggle(role.id, permission.id)}
                  disabled={readOnly}
                  className={cn(
                    "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                    hasAccess
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-muted-foreground/20 hover:border-muted-foreground/40",
                    !readOnly && "hover:scale-110",
                    readOnly && "cursor-default"
                  )}
                >
                  {hasAccess ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

interface CompactPermissionMatrixProps {
  roles: MockRole[];
  permissions: MockPermission[];
  onPermissionChange?: (roleId: string, permissionId: string, granted: boolean) => void;
  readOnly?: boolean;
  className?: string;
}

function CompactPermissionMatrix({
  roles,
  permissions,
  onPermissionChange,
  readOnly = false,
  className
}: CompactPermissionMatrixProps) {
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, MockPermission[]>);

  return (
    <div className={cn("space-y-4", className)}>
      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categoryPermissions.map(permission => (
                <div key={permission.id} className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{permission.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {permission.resource}.{permission.action}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {roles.map(role => {
                      const hasAccess = roleUtils.roleHasPermission(role.id, permission.id);
                      return (
                        <div
                          key={role.id}
                          className={cn(
                            "w-4 h-4 rounded-full border",
                            hasAccess 
                              ? "bg-green-500 border-green-500" 
                              : "border-muted-foreground/20"
                          )}
                          title={`${role.name}: ${hasAccess ? 'Allowed' : 'Denied'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default PermissionMatrix;