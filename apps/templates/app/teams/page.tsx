"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Textarea } from "@midday/ui/textarea";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@midday/ui/sheet";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { useToast } from "@midday/ui/use-toast";
import { cn } from "@midday/ui/cn";
import { 
  Users, 
  Plus, 
  Search,
  UserPlus,
  Settings,
  Crown,
  Star,
  Calendar,
  Mail,
  Phone,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { rolesAPI, type MockTeam, type MockTeamMember, type MockRole } from "@/lib/mock/roles-mock";
import TeamCard, { TeamStatsCard, TeamMemberItem } from "@/components/team-card";
import RoleBadge from "@/components/role-badge";
import PermissionGate from "@/components/permission-gate";

export default function TeamsPage() {
  const [teams, setTeams] = useState<MockTeam[]>([]);
  const [roles, setRoles] = useState<MockRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<MockTeam | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [currentUserRole] = useState("admin"); // Mock current user role
  const { toast } = useToast();

  useEffect(() => {
    loadTeams();
    loadRoles();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await rolesAPI.getTeams();
      setTeams(data);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    const data = await rolesAPI.getRoles();
    setRoles(data);
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTeam = async (teamData: Partial<MockTeam>) => {
    try {
      await rolesAPI.createTeam(teamData);
      toast({
        title: "Team created",
        description: `${teamData.name} has been created successfully`,
      });
      setShowCreateDialog(false);
      await loadTeams();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    }
  };

  const handleEditTeam = async (teamData: Partial<MockTeam>) => {
    if (!selectedTeam) return;
    
    try {
      await rolesAPI.updateTeam(selectedTeam.id, teamData);
      toast({
        title: "Team updated",
        description: `${teamData.name} has been updated successfully`,
      });
      setShowEditDialog(false);
      setSelectedTeam(null);
      await loadTeams();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update team",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;
    
    try {
      await rolesAPI.deleteTeam(selectedTeam.id);
      toast({
        title: "Team deleted",
        description: `${selectedTeam.name} has been deleted successfully`,
      });
      setShowDeleteDialog(false);
      setSelectedTeam(null);
      await loadTeams();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    }
  };

  const handleAddMember = async (memberData: { userId: string; role: string; email: string; name: string }) => {
    if (!selectedTeam) return;

    try {
      await rolesAPI.addTeamMember(selectedTeam.id, {
        userId: memberData.userId,
        role: memberData.role,
        addedBy: "current-user",
        user: {
          id: memberData.userId,
          name: memberData.name,
          email: memberData.email,
          avatar: `https://avatar.vercel.sh/${memberData.name}`
        }
      });
      
      toast({
        title: "Member added",
        description: `${memberData.name} has been added to ${selectedTeam.name}`,
      });
      setShowAddMember(false);
      await loadTeams();
      
      // Update selected team
      const updatedTeam = await rolesAPI.getTeam(selectedTeam.id);
      if (updatedTeam) setSelectedTeam(updatedTeam);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add member",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (member: MockTeamMember) => {
    if (!selectedTeam) return;

    try {
      await rolesAPI.removeTeamMember(selectedTeam.id, member.id);
      toast({
        title: "Member removed",
        description: `${member.user.name} has been removed from ${selectedTeam.name}`,
      });
      await loadTeams();
      
      // Update selected team
      const updatedTeam = await rolesAPI.getTeam(selectedTeam.id);
      if (updatedTeam) setSelectedTeam(updatedTeam);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = async (member: MockTeamMember, newRole: string) => {
    if (!selectedTeam) return;

    try {
      await rolesAPI.updateTeamMemberRole(selectedTeam.id, member.id, newRole);
      toast({
        title: "Role updated",
        description: `${member.user.name}'s role has been updated`,
      });
      await loadTeams();
      
      // Update selected team
      const updatedTeam = await rolesAPI.getTeam(selectedTeam.id);
      if (updatedTeam) setSelectedTeam(updatedTeam);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const teamStats = {
    total: teams.length,
    totalMembers: teams.reduce((sum, team) => sum + team.memberCount, 0),
    averageSize: teams.length > 0 ? teams.reduce((sum, team) => sum + team.memberCount, 0) / teams.length : 0,
    defaultTeams: teams.filter(team => team.isDefault).length,
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading teams...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
            <p className="text-muted-foreground">
              Organize users into teams and manage their roles and permissions
            </p>
          </div>
          
          <PermissionGate 
            userRole={currentUserRole} 
            permission="teams.manage"
          >
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </PermissionGate>
        </div>

        {/* Stats */}
        <TeamStatsCard teams={teams} />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map(team => (
          <TeamCard
            key={team.id}
            team={team}
            onView={(team) => {
              setSelectedTeam(team);
              setShowTeamDetails(true);
            }}
            onEdit={(team) => {
              setSelectedTeam(team);
              setShowEditDialog(true);
            }}
            onDelete={(team) => {
              setSelectedTeam(team);
              setShowDeleteDialog(true);
            }}
            onAddMember={(team) => {
              setSelectedTeam(team);
              setShowAddMember(true);
            }}
            onManageMembers={(team) => {
              setSelectedTeam(team);
              setShowTeamDetails(true);
            }}
          />
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No teams found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? "Try adjusting your search query or create a new team."
              : "Get started by creating your first team."
            }
          </p>
          <PermissionGate userRole={currentUserRole} permission="teams.manage">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </PermissionGate>
        </div>
      )}

      {/* Create Team Dialog */}
      <CreateTeamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateTeam}
      />

      {/* Edit Team Dialog */}
      <EditTeamDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        team={selectedTeam}
        onEdit={handleEditTeam}
      />

      {/* Delete Team Dialog */}
      <DeleteTeamDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        team={selectedTeam}
        onDelete={handleDeleteTeam}
      />

      {/* Team Details Sheet */}
      <TeamDetailsSheet
        open={showTeamDetails}
        onOpenChange={setShowTeamDetails}
        team={selectedTeam}
        roles={roles}
        onRemoveMember={handleRemoveMember}
        onChangeRole={handleChangeRole}
        onAddMember={() => setShowAddMember(true)}
      />

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        team={selectedTeam}
        roles={roles}
        onAddMember={handleAddMember}
      />
    </div>
  );
}

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: Partial<MockTeam>) => void;
}

function CreateTeamDialog({ open, onOpenChange, onCreate }: CreateTeamDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "bg-blue-500"
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.description) return;
    
    onCreate({
      ...formData,
      owner: "current-user"
    });
    
    setFormData({
      name: "",
      description: "",
      color: "bg-blue-500"
    });
  };

  const colorOptions = [
    { value: "bg-blue-500", label: "Blue" },
    { value: "bg-green-500", label: "Green" },
    { value: "bg-purple-500", label: "Purple" },
    { value: "bg-red-500", label: "Red" },
    { value: "bg-orange-500", label: "Orange" },
    { value: "bg-teal-500", label: "Teal" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team to organize users and manage their access.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Team Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter team name"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter team description"
              rows={3}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Color</label>
            <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded", option.value)} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || !formData.description}>
            Create Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: MockTeam | null;
  onEdit: (data: Partial<MockTeam>) => void;
}

function EditTeamDialog({ open, onOpenChange, team, onEdit }: EditTeamDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "bg-blue-500"
  });

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description,
        color: team.color,
      });
    }
  }, [team]);

  const handleSubmit = () => {
    if (!formData.name || !formData.description) return;
    onEdit(formData);
  };

  if (!team) return null;

  const colorOptions = [
    { value: "bg-blue-500", label: "Blue" },
    { value: "bg-green-500", label: "Green" },
    { value: "bg-purple-500", label: "Purple" },
    { value: "bg-red-500", label: "Red" },
    { value: "bg-orange-500", label: "Orange" },
    { value: "bg-teal-500", label: "Teal" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update team information and settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Team Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter team name"
              disabled={team.isDefault}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter team description"
              rows={3}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Color</label>
            <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded", option.value)} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || !formData.description}>
            Update Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: MockTeam | null;
  onDelete: () => void;
}

function DeleteTeamDialog({ open, onOpenChange, team, onDelete }: DeleteTeamDialogProps) {
  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Team
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the team "{team.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Warning</p>
              <p className="text-sm text-muted-foreground">
                All team members will be removed from this team. Make sure to reassign them to other teams if needed.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TeamDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: MockTeam | null;
  roles: MockRole[];
  onRemoveMember: (member: MockTeamMember) => void;
  onChangeRole: (member: MockTeamMember, role: string) => void;
  onAddMember: () => void;
}

function TeamDetailsSheet({ 
  open, 
  onOpenChange, 
  team, 
  roles,
  onRemoveMember, 
  onChangeRole,
  onAddMember 
}: TeamDetailsSheetProps) {
  if (!team) return null;

  const ownerMember = team.members.find(m => m.userId === team.owner);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:w-[600px]">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center text-white",
              team.color
            )}>
              <Users className="h-6 w-6" />
            </div>
            <div>
              <SheetTitle className="flex items-center gap-2">
                {team.name}
                {team.isDefault && (
                  <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                )}
              </SheetTitle>
              <SheetDescription>{team.description}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Team Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Members</h4>
              <p className="text-lg font-semibold">{team.memberCount}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
              <p className="text-lg font-semibold">{team.createdAt.toLocaleDateString()}</p>
            </div>
          </div>

          {/* Owner */}
          {ownerMember && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Team Owner
                </h3>
              </div>
              <TeamMemberItem member={ownerMember} />
            </div>
          )}

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Members</h3>
              <Button size="sm" onClick={onAddMember}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
            <div className="space-y-2">
              {team.members
                .filter(m => m.userId !== team.owner)
                .map(member => (
                  <TeamMemberItem
                    key={member.id}
                    member={member}
                    onRemove={() => onRemoveMember(member)}
                    onRoleChange={() => {
                      // For demo, just cycle through roles
                      const currentRoleIndex = roles.findIndex(r => r.id === member.role);
                      const nextRole = roles[(currentRoleIndex + 1) % roles.length];
                      onChangeRole(member, nextRole.id);
                    }}
                  />
                ))}
              
              {team.members.filter(m => m.userId !== team.owner).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-8 w-8 mb-2" />
                  <p>No team members yet</p>
                  <p className="text-sm">Add members to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: MockTeam | null;
  roles: MockRole[];
  onAddMember: (data: { userId: string; role: string; email: string; name: string }) => void;
}

function AddMemberDialog({ open, onOpenChange, team, roles, onAddMember }: AddMemberDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member"
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.role) return;
    
    onAddMember({
      userId: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      email: formData.email,
      role: formData.role
    });
    
    setFormData({
      name: "",
      email: "",
      role: "member"
    });
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a new member to {team.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Role</label>
            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
              <SelectTrigger>
                <SelectValue />
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || !formData.email || !formData.role}>
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}