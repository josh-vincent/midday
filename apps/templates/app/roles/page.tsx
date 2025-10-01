"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@midday/ui/dropdown-menu";
import { useToast } from "@midday/ui/use-toast";
import { cn } from "@midday/ui/cn";
import { 
  Shield, 
  Plus, 
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Crown,
  Eye,
  Settings,
  AlertTriangle,
  Check,
  X
} from "lucide-react";
import { rolesAPI, type MockRole, type MockPermission } from "@/lib/mock/roles-mock";
import { roleUtils } from "@/lib/utils/roles";
import RoleBadge from "@/components/role-badge";
import PermissionMatrix from "@/components/permission-matrix";
import PermissionGate from "@/components/permission-gate";

export default function RolesPage() {
  const [roles, setRoles] = useState<MockRole[]>([]);
  const [permissions, setPermissions] = useState<MockPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<MockRole | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentUserRole] = useState("admin"); // Mock current user role
  const { toast } = useToast();

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

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRole = async (roleData: Partial<MockRole>) => {
    try {
      await rolesAPI.createRole(roleData);
      toast({
        title: "Role created",
        description: `${roleData.name} has been created successfully`,
      });
      setShowCreateDialog(false);
      await loadRoles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    }
  };

  const handleEditRole = async (roleData: Partial<MockRole>) => {
    if (!selectedRole) return;
    
    try {
      await rolesAPI.updateRole(selectedRole.id, roleData);
      toast({
        title: "Role updated",
        description: `${roleData.name} has been updated successfully`,
      });
      setShowEditDialog(false);
      setSelectedRole(null);
      await loadRoles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    
    try {
      await rolesAPI.deleteRole(selectedRole.id);
      toast({
        title: "Role deleted",
        description: `${selectedRole.name} has been deleted successfully`,
      });
      setShowDeleteDialog(false);
      setSelectedRole(null);
      await loadRoles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  const handlePermissionChange = async (roleId: string, permissionId: string, granted: boolean) => {
    try {
      const role = roles.find(r => r.id === roleId);
      if (!role) return;

      const newPermissions = granted
        ? [...role.permissions, permissionId]
        : role.permissions.filter(p => p !== permissionId);

      await rolesAPI.updateRole(roleId, { permissions: newPermissions });
      await loadRoles();
      
      toast({
        title: "Permission updated",
        description: `Permission ${granted ? 'granted' : 'revoked'} for ${role.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive",
      });
    }
  };

  const roleStats = {
    total: roles.length,
    system: roles.filter(r => r.isSystem).length,
    custom: roles.filter(r => !r.isSystem).length,
    totalPermissions: permissions.length,
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground">
              Manage user roles and permissions for your organization
            </p>
          </div>
          
          <PermissionGate 
            userRole={currentUserRole} 
            permission="roles.manage"
          >
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </PermissionGate>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Roles</p>
                  <p className="text-2xl font-bold">{roleStats.total}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">System Roles</p>
                  <p className="text-2xl font-bold">{roleStats.system}</p>
                </div>
                <Crown className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Custom Roles</p>
                  <p className="text-2xl font-bold">{roleStats.custom}</p>
                </div>
                <Settings className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Permissions</p>
                  <p className="text-2xl font-bold">{roleStats.totalPermissions}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                currentUserRole={currentUserRole}
                onEdit={() => {
                  setSelectedRole(role);
                  setShowEditDialog(true);
                }}
                onDelete={() => {
                  setSelectedRole(role);
                  setShowDeleteDialog(true);
                }}
                onView={() => {
                  setSelectedRole(role);
                }}
              />
            ))}
          </div>

          {filteredRoles.length === 0 && (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No roles found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search query or create a new role.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <PermissionMatrix
            roles={filteredRoles}
            permissions={permissions}
            onPermissionChange={handlePermissionChange}
            readOnly={!roleUtils.roleHasPermission(currentUserRole, 'roles.manage')}
          />
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <CreateRoleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateRole}
        permissions={permissions}
      />

      {/* Edit Role Dialog */}
      <EditRoleDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        role={selectedRole}
        onEdit={handleEditRole}
        permissions={permissions}
      />

      {/* Delete Role Dialog */}
      <DeleteRoleDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        role={selectedRole}
        onDelete={handleDeleteRole}
      />
    </div>
  );
}

interface RoleCardProps {
  role: MockRole;
  currentUserRole: string;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

function RoleCard({ role, currentUserRole, onEdit, onDelete, onView }: RoleCardProps) {
  const IconComponent = role.icon;
  const roleStats = roleUtils.getRoleStats(role.id);
  const canEdit = roleUtils.canManageRole(currentUserRole, role.id);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center text-white",
              role.color
            )}>
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {role.name}
                {role.isSystem && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {role.description}
              </CardDescription>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Role
                </DropdownMenuItem>
              )}
              {canEdit && !role.isSystem && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Role
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Level</span>
            <Badge variant="outline">{role.level}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Permissions</span>
            <span className="font-medium">{role.permissions.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Coverage</span>
            <span className="font-medium">
              {roleStats?.permissionCoverage.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Categories</h4>
          <div className="flex flex-wrap gap-1">
            {roleStats?.permissionsByCategory.slice(0, 3).map(category => (
              <Badge key={category.category} variant="secondary" className="text-xs">
                {category.category}
              </Badge>
            ))}
            {roleStats && roleStats.permissionsByCategory.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{roleStats.permissionsByCategory.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onView} className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: Partial<MockRole>) => void;
  permissions: MockPermission[];
}

function CreateRoleDialog({ open, onOpenChange, onCreate, permissions }: CreateRoleDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    level: 50,
    color: "bg-blue-500",
    permissions: [] as string[]
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.description) return;
    
    onCreate({
      ...formData,
      icon: Shield
    });
    
    setFormData({
      name: "",
      description: "",
      level: 50,
      color: "bg-blue-500",
      permissions: []
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Create a new role with custom permissions and settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter role name"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter role description"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Level (1-100)</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={formData.level}
              onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || !formData.description}>
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: MockRole | null;
  onEdit: (data: Partial<MockRole>) => void;
  permissions: MockPermission[];
}

function EditRoleDialog({ open, onOpenChange, role, onEdit, permissions }: EditRoleDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    level: 50,
    color: "bg-blue-500",
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        level: role.level,
        color: role.color,
      });
    }
  }, [role]);

  const handleSubmit = () => {
    if (!formData.name || !formData.description) return;
    onEdit(formData);
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>
            Update role information and settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter role name"
              disabled={role.isSystem}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter role description"
              disabled={role.isSystem}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Level (1-100)</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={formData.level}
              onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
              disabled={role.isSystem}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || !formData.description}>
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: MockRole | null;
  onDelete: () => void;
}

function DeleteRoleDialog({ open, onOpenChange, role, onDelete }: DeleteRoleDialogProps) {
  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Role
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the role "{role.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Warning</p>
              <p className="text-sm text-muted-foreground">
                Users with this role will lose their current permissions. Make sure to assign them a new role before deletion.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}