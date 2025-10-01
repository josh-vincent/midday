"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Checkbox } from "@midday/ui/checkbox";
import { cn } from "@midday/ui/cn";
import { 
  Shield, 
  Search,
  Filter,
  Check,
  X,
  Eye,
  Users,
  Database,
  FileText,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  Mail,
  Clock,
  Package,
  Zap,
  AlertCircle,
  Info,
  TrendingUp
} from "lucide-react";
import { rolesAPI, type MockRole, type MockPermission } from "@/lib/mock/roles-mock";
import { permissionCategories } from "@/lib/utils/roles";
import RoleBadge from "@/components/role-badge";
import PermissionMatrix from "@/components/permission-matrix";
import PermissionGate from "@/components/permission-gate";

export default function PermissionsPage() {
  const [roles, setRoles] = useState<MockRole[]>([]);
  const [permissions, setPermissions] = useState<MockPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [currentUserRole] = useState("admin"); // Mock current user role

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesAPI.getRoles();
      setRoles(data);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    const data = await rolesAPI.getPermissions();
    setPermissions(data);
  };

  // Get unique categories and actions
  const categories = permissionCategories.getAllCategories();
  const actions = [...new Set(permissions.map(p => p.action))].sort();

  // Filter permissions
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = !searchQuery || 
      permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.resource.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || permission.category === selectedCategory;
    const matchesAction = selectedAction === "all" || permission.action === selectedAction;
    
    // Filter by role if selected
    const matchesRole = selectedRole === "all" || 
      roles.find(r => r.id === selectedRole)?.permissions.includes(permission.id);
    
    return matchesSearch && matchesCategory && matchesAction && matchesRole;
  });

  // Group permissions by category
  const permissionsByCategory = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, MockPermission[]>);

  // Category statistics
  const categoryStats = permissionCategories.getCategoryStats();

  // Permission checker tool state
  const [checkerRole, setCheckerRole] = useState<string>("member");
  const [checkerPermission, setCheckerPermission] = useState<string>("");
  const [checkerResult, setCheckerResult] = useState<{
    hasPermission: boolean;
    reason?: string;
  } | null>(null);

  const checkPermission = () => {
    if (!checkerPermission) return;
    
    const role = roles.find(r => r.id === checkerRole);
    if (!role) return;
    
    const hasPermission = role.permissions.includes(checkerPermission);
    setCheckerResult({
      hasPermission,
      reason: hasPermission 
        ? `Role '${role.name}' has permission '${checkerPermission}'`
        : `Role '${role.name}' does not have permission '${checkerPermission}'`
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Customers": return Users;
      case "Invoices": return FileText;
      case "Transactions": return DollarSign;
      case "Database": return Database;
      case "Documents": return FileText;
      case "Reports": return BarChart3;
      case "Calendar": return Calendar;
      case "Time Tracking": return Clock;
      case "Email": return Mail;
      case "Queue": return Zap;
      case "System": return Settings;
      default: return Shield;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-green-500";
      case "read": return "bg-blue-500";
      case "update": return "bg-yellow-500";
      case "delete": return "bg-red-500";
      case "manage": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const roleHasPermission = (roleId: string, permissionId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.permissions.includes(permissionId) : false;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permission Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor permissions across your organization
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Permissions</p>
                  <p className="text-2xl font-bold">{permissions.length}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
                <Filter className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Actions</p>
                  <p className="text-2xl font-bold">{actions.length}</p>
                </div>
                <Settings className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Roles</p>
                  <p className="text-2xl font-bold">{roles.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
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

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground ml-auto">
                {filteredPermissions.length} permission{filteredPermissions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          <TabsTrigger value="checker">Permission Checker</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Category Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryStats.map(category => {
              const IconComponent = getCategoryIcon(category.name);
              const categoryPermissions = permissionsByCategory[category.name] || [];
              
              return (
                <Card key={category.name}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      {category.name}
                    </CardTitle>
                    <CardDescription>
                      {category.permissionCount} permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {category.actions.map(action => (
                          <Badge
                            key={action}
                            className={cn("text-white text-xs", getActionColor(action))}
                          >
                            {action}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Resources</h4>
                        <div className="flex flex-wrap gap-1">
                          {category.resources.map(resource => (
                            <Badge key={resource} variant="outline" className="text-xs">
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {selectedCategory === "all" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCategory(category.name)}
                          className="w-full"
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filtered Permissions List */}
          {selectedCategory !== "all" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedCategory} Permissions
                </CardTitle>
                <CardDescription>
                  Detailed view of permissions in the {selectedCategory} category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="font-medium text-lg">{category}</h3>
                      <div className="grid gap-3">
                        {categoryPermissions.map(permission => (
                          <div key={permission.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium">{permission.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {permission.resource}
                                </Badge>
                                <Badge 
                                  className={cn("text-white text-xs", getActionColor(permission.action))}
                                >
                                  {permission.action}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Roles with access:</span>
                              <div className="flex gap-1">
                                {roles
                                  .filter(role => role.permissions.includes(permission.id))
                                  .slice(0, 3)
                                  .map(role => (
                                    <RoleBadge key={role.id} roleId={role.id} size="sm" />
                                  ))}
                                {roles.filter(role => role.permissions.includes(permission.id)).length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{roles.filter(role => role.permissions.includes(permission.id)).length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="matrix" className="space-y-6">
          <PermissionMatrix
            roles={roles}
            permissions={filteredPermissions}
            readOnly={true}
            showLegend={true}
          />
        </TabsContent>

        <TabsContent value="checker" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Permission Checker
              </CardTitle>
              <CardDescription>
                Test if a specific role has a particular permission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <Select value={checkerRole} onValueChange={setCheckerRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Permission</label>
                  <Select value={checkerPermission} onValueChange={setCheckerPermission}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      {permissions.map(permission => (
                        <SelectItem key={permission.id} value={permission.id}>
                          {permission.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={checkPermission} disabled={!checkerRole || !checkerPermission}>
                <Eye className="h-4 w-4 mr-2" />
                Check Permission
              </Button>

              {checkerResult && (
                <div className={cn(
                  "border rounded-lg p-4",
                  checkerResult.hasPermission
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : "border-red-500 bg-red-50 dark:bg-red-950"
                )}>
                  <div className="flex items-center gap-2">
                    {checkerResult.hasPermission ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                    <span className={cn(
                      "font-medium",
                      checkerResult.hasPermission ? "text-green-600" : "text-red-600"
                    )}>
                      {checkerResult.hasPermission ? "Permission Granted" : "Permission Denied"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {checkerResult.reason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Permission Hierarchy
              </CardTitle>
              <CardDescription>
                Visual representation of role hierarchy and permission inheritance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {roles
                  .sort((a, b) => b.level - a.level)
                  .map(role => {
                    const rolePermissions = permissions.filter(p => role.permissions.includes(p.id));
                    const permissionsByCategory = rolePermissions.reduce((acc, permission) => {
                      if (!acc[permission.category]) {
                        acc[permission.category] = [];
                      }
                      acc[permission.category].push(permission);
                      return acc;
                    }, {} as Record<string, MockPermission[]>);

                    return (
                      <div key={role.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <RoleBadge roleId={role.id} />
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Level {role.level} • {rolePermissions.length} permissions
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {((rolePermissions.length / permissions.length) * 100).toFixed(0)}% coverage
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(permissionsByCategory).map(([category, perms]) => (
                            <div key={category} className="border rounded p-3">
                              <h4 className="font-medium text-sm mb-2">{category}</h4>
                              <div className="flex flex-wrap gap-1">
                                {perms.map(permission => (
                                  <Badge
                                    key={permission.id}
                                    className={cn("text-white text-xs", getActionColor(permission.action))}
                                  >
                                    {permission.action}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}