"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@midday/ui/dropdown-menu";
import { cn } from "@midday/ui/cn";
import { 
  Users, 
  Crown,
  MoreHorizontal,
  UserPlus,
  Settings,
  Trash2,
  Eye,
  Calendar,
  Star
} from "lucide-react";
import { type MockTeam, type MockTeamMember } from "@/lib/mock/roles-mock";
import RoleBadge from "./role-badge";

interface TeamCardProps {
  team: MockTeam;
  onEdit?: (team: MockTeam) => void;
  onDelete?: (team: MockTeam) => void;
  onView?: (team: MockTeam) => void;
  onAddMember?: (team: MockTeam) => void;
  onManageMembers?: (team: MockTeam) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export function TeamCard({
  team,
  onEdit,
  onDelete,
  onView,
  onAddMember,
  onManageMembers,
  showActions = true,
  compact = false,
  className
}: TeamCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const ownerMember = team.members.find(m => m.userId === team.owner);
  const displayMembers = isExpanded ? team.members : team.members.slice(0, compact ? 2 : 4);
  const remainingCount = team.members.length - displayMembers.length;

  if (compact) {
    return (
      <CompactTeamCard
        team={team}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        showActions={showActions}
        className={className}
      />
    );
  }

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center text-white",
              team.color
            )}>
              <Users className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {team.name}
                {team.isDefault && (
                  <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {team.description}
              </CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {team.memberCount} members
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Created {team.createdAt.toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(team)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(team)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Team
                  </DropdownMenuItem>
                )}
                {onAddMember && (
                  <DropdownMenuItem onClick={() => onAddMember(team)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </DropdownMenuItem>
                )}
                {onManageMembers && (
                  <DropdownMenuItem onClick={() => onManageMembers(team)}>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Members
                  </DropdownMenuItem>
                )}
                {onDelete && !team.isDefault && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(team)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Team
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Owner */}
        {ownerMember && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              Team Owner
            </h4>
            <TeamMemberItem member={ownerMember} />
          </div>
        )}

        {/* Members */}
        <div>
          <h4 className="text-sm font-medium mb-2">Members</h4>
          <div className="space-y-2">
            {displayMembers
              .filter(m => m.userId !== team.owner)
              .map(member => (
                <TeamMemberItem key={member.id} member={member} />
              ))}
            
            {remainingCount > 0 && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">
                  {remainingCount} more member{remainingCount > 1 ? 's' : ''}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Show Less' : 'Show All'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {showActions && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(team)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            )}
            {onAddMember && (
              <Button variant="outline" size="sm" onClick={() => onAddMember(team)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
            {onManageMembers && (
              <Button variant="outline" size="sm" onClick={() => onManageMembers(team)}>
                <Users className="h-4 w-4 mr-2" />
                Manage
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TeamMemberItemProps {
  member: MockTeamMember;
  showRole?: boolean;
  showStatus?: boolean;
  onRemove?: (member: MockTeamMember) => void;
  onRoleChange?: (member: MockTeamMember) => void;
}

export function TeamMemberItem({
  member,
  showRole = true,
  showStatus = true,
  onRemove,
  onRoleChange
}: TeamMemberItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={member.user.avatar} />
          <AvatarFallback>
            {member.user.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-sm">{member.user.name}</div>
          <div className="text-xs text-muted-foreground">{member.user.email}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {showStatus && member.status !== 'active' && (
          <Badge variant="outline" className="text-xs">
            {member.status}
          </Badge>
        )}
        {showRole && (
          <RoleBadge roleId={member.role} size="sm" variant="outline" />
        )}
        {(onRemove || onRoleChange) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRoleChange && (
                <DropdownMenuItem onClick={() => onRoleChange(member)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Change Role
                </DropdownMenuItem>
              )}
              {onRemove && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onRemove(member)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

interface CompactTeamCardProps {
  team: MockTeam;
  onView?: (team: MockTeam) => void;
  onEdit?: (team: MockTeam) => void;
  onDelete?: (team: MockTeam) => void;
  showActions?: boolean;
  className?: string;
}

function CompactTeamCard({
  team,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  className
}: CompactTeamCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center text-white",
              team.color
            )}>
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium flex items-center gap-2">
                {team.name}
                {team.isDefault && (
                  <Star className="h-3 w-3 text-yellow-500" fill="currentColor" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {team.memberCount} members
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Member avatars */}
            <div className="flex -space-x-2">
              {team.members.slice(0, 3).map(member => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={member.user.avatar} />
                  <AvatarFallback className="text-xs">
                    {member.user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
              {team.memberCount > 3 && (
                <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs">
                  +{team.memberCount - 3}
                </div>
              )}
            </div>

            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(team)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(team)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Team
                    </DropdownMenuItem>
                  )}
                  {onDelete && !team.isDefault && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(team)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Team
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TeamStatsCardProps {
  teams: MockTeam[];
  className?: string;
}

export function TeamStatsCard({ teams, className }: TeamStatsCardProps) {
  const totalMembers = teams.reduce((sum, team) => sum + team.memberCount, 0);
  const averageTeamSize = teams.length > 0 ? totalMembers / teams.length : 0;
  const largestTeam = teams.reduce((max, team) => 
    team.memberCount > max.memberCount ? team : max, teams[0]
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Team Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{teams.length}</div>
            <div className="text-sm text-muted-foreground">Total Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalMembers}</div>
            <div className="text-sm text-muted-foreground">Total Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{averageTeamSize.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Avg Team Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{largestTeam?.memberCount || 0}</div>
            <div className="text-sm text-muted-foreground">Largest Team</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TeamCard;