import { 
  Crown, 
  Shield, 
  Users, 
  Eye, 
  UserCheck,
  Database,
  FileText,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  Mail,
  Clock,
  Package,
  Zap
} from "lucide-react";

export interface MockPermission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface MockRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  icon: any;
  level: number;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockTeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  joinedAt: Date;
  addedBy: string;
  status: 'active' | 'pending' | 'inactive';
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface MockTeamInvite {
  id: string;
  teamId: string;
  email: string;
  role: string;
  inviteCode: string;
  invitedBy: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  teamName: string;
  inviterName: string;
}

export interface MockTeam {
  id: string;
  name: string;
  description: string;
  members: MockTeamMember[];
  owner: string;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
  color: string;
  memberCount: number;
  country?: string;
  currency?: string;
  logo?: string;
}

// Permissions data
const mockPermissions: MockPermission[] = [
  // Customer permissions
  { id: 'customers.create', name: 'Create Customers', description: 'Create new customer records', category: 'Customers', resource: 'customers', action: 'create' },
  { id: 'customers.read', name: 'View Customers', description: 'View customer information', category: 'Customers', resource: 'customers', action: 'read' },
  { id: 'customers.update', name: 'Update Customers', description: 'Edit customer information', category: 'Customers', resource: 'customers', action: 'update' },
  { id: 'customers.delete', name: 'Delete Customers', description: 'Delete customer records', category: 'Customers', resource: 'customers', action: 'delete' },
  { id: 'customers.manage', name: 'Manage Customers', description: 'Full customer management access', category: 'Customers', resource: 'customers', action: 'manage' },

  // Invoice permissions
  { id: 'invoices.create', name: 'Create Invoices', description: 'Create new invoices', category: 'Invoices', resource: 'invoices', action: 'create' },
  { id: 'invoices.read', name: 'View Invoices', description: 'View invoice information', category: 'Invoices', resource: 'invoices', action: 'read' },
  { id: 'invoices.update', name: 'Update Invoices', description: 'Edit invoice information', category: 'Invoices', resource: 'invoices', action: 'update' },
  { id: 'invoices.delete', name: 'Delete Invoices', description: 'Delete invoice records', category: 'Invoices', resource: 'invoices', action: 'delete' },
  { id: 'invoices.manage', name: 'Manage Invoices', description: 'Full invoice management access', category: 'Invoices', resource: 'invoices', action: 'manage' },

  // Transaction permissions
  { id: 'transactions.create', name: 'Create Transactions', description: 'Create new transactions', category: 'Transactions', resource: 'transactions', action: 'create' },
  { id: 'transactions.read', name: 'View Transactions', description: 'View transaction information', category: 'Transactions', resource: 'transactions', action: 'read' },
  { id: 'transactions.update', name: 'Update Transactions', description: 'Edit transaction information', category: 'Transactions', resource: 'transactions', action: 'update' },
  { id: 'transactions.delete', name: 'Delete Transactions', description: 'Delete transaction records', category: 'Transactions', resource: 'transactions', action: 'delete' },
  { id: 'transactions.manage', name: 'Manage Transactions', description: 'Full transaction management access', category: 'Transactions', resource: 'transactions', action: 'manage' },

  // Database permissions
  { id: 'database.create', name: 'Create Database Objects', description: 'Create new database objects', category: 'Database', resource: 'database', action: 'create' },
  { id: 'database.read', name: 'View Database', description: 'View database information', category: 'Database', resource: 'database', action: 'read' },
  { id: 'database.update', name: 'Update Database', description: 'Modify database objects', category: 'Database', resource: 'database', action: 'update' },
  { id: 'database.delete', name: 'Delete Database Objects', description: 'Delete database objects', category: 'Database', resource: 'database', action: 'delete' },
  { id: 'database.manage', name: 'Manage Database', description: 'Full database management access', category: 'Database', resource: 'database', action: 'manage' },

  // Documents permissions
  { id: 'documents.create', name: 'Create Documents', description: 'Upload and create documents', category: 'Documents', resource: 'documents', action: 'create' },
  { id: 'documents.read', name: 'View Documents', description: 'View and download documents', category: 'Documents', resource: 'documents', action: 'read' },
  { id: 'documents.update', name: 'Update Documents', description: 'Edit document information', category: 'Documents', resource: 'documents', action: 'update' },
  { id: 'documents.delete', name: 'Delete Documents', description: 'Delete documents', category: 'Documents', resource: 'documents', action: 'delete' },
  { id: 'documents.manage', name: 'Manage Documents', description: 'Full document management access', category: 'Documents', resource: 'documents', action: 'manage' },

  // Reports permissions
  { id: 'reports.create', name: 'Create Reports', description: 'Create new reports', category: 'Reports', resource: 'reports', action: 'create' },
  { id: 'reports.read', name: 'View Reports', description: 'View reports and analytics', category: 'Reports', resource: 'reports', action: 'read' },
  { id: 'reports.update', name: 'Update Reports', description: 'Edit report configurations', category: 'Reports', resource: 'reports', action: 'update' },
  { id: 'reports.delete', name: 'Delete Reports', description: 'Delete reports', category: 'Reports', resource: 'reports', action: 'delete' },
  { id: 'reports.manage', name: 'Manage Reports', description: 'Full reports management access', category: 'Reports', resource: 'reports', action: 'manage' },

  // Calendar permissions
  { id: 'calendar.create', name: 'Create Events', description: 'Create calendar events', category: 'Calendar', resource: 'calendar', action: 'create' },
  { id: 'calendar.read', name: 'View Calendar', description: 'View calendar events', category: 'Calendar', resource: 'calendar', action: 'read' },
  { id: 'calendar.update', name: 'Update Events', description: 'Edit calendar events', category: 'Calendar', resource: 'calendar', action: 'update' },
  { id: 'calendar.delete', name: 'Delete Events', description: 'Delete calendar events', category: 'Calendar', resource: 'calendar', action: 'delete' },
  { id: 'calendar.manage', name: 'Manage Calendar', description: 'Full calendar management access', category: 'Calendar', resource: 'calendar', action: 'manage' },

  // Time tracking permissions
  { id: 'time.create', name: 'Create Time Entries', description: 'Create time tracking entries', category: 'Time Tracking', resource: 'time', action: 'create' },
  { id: 'time.read', name: 'View Time Entries', description: 'View time tracking data', category: 'Time Tracking', resource: 'time', action: 'read' },
  { id: 'time.update', name: 'Update Time Entries', description: 'Edit time tracking entries', category: 'Time Tracking', resource: 'time', action: 'update' },
  { id: 'time.delete', name: 'Delete Time Entries', description: 'Delete time tracking entries', category: 'Time Tracking', resource: 'time', action: 'delete' },
  { id: 'time.manage', name: 'Manage Time Tracking', description: 'Full time tracking management access', category: 'Time Tracking', resource: 'time', action: 'manage' },

  // Email permissions
  { id: 'email.create', name: 'Send Emails', description: 'Send emails to customers', category: 'Email', resource: 'email', action: 'create' },
  { id: 'email.read', name: 'View Emails', description: 'View email history', category: 'Email', resource: 'email', action: 'read' },
  { id: 'email.update', name: 'Update Email Templates', description: 'Edit email templates', category: 'Email', resource: 'email', action: 'update' },
  { id: 'email.delete', name: 'Delete Emails', description: 'Delete email records', category: 'Email', resource: 'email', action: 'delete' },
  { id: 'email.manage', name: 'Manage Email', description: 'Full email management access', category: 'Email', resource: 'email', action: 'manage' },

  // Queue permissions
  { id: 'queue.create', name: 'Create Jobs', description: 'Create background jobs', category: 'Queue', resource: 'queue', action: 'create' },
  { id: 'queue.read', name: 'View Queue', description: 'View job queue status', category: 'Queue', resource: 'queue', action: 'read' },
  { id: 'queue.update', name: 'Update Jobs', description: 'Retry or modify jobs', category: 'Queue', resource: 'queue', action: 'update' },
  { id: 'queue.delete', name: 'Delete Jobs', description: 'Remove jobs from queue', category: 'Queue', resource: 'queue', action: 'delete' },
  { id: 'queue.manage', name: 'Manage Queue', description: 'Full queue management access', category: 'Queue', resource: 'queue', action: 'manage' },

  // System permissions
  { id: 'system.settings', name: 'System Settings', description: 'Manage system settings', category: 'System', resource: 'system', action: 'manage' },
  { id: 'roles.manage', name: 'Manage Roles', description: 'Create and manage user roles', category: 'System', resource: 'roles', action: 'manage' },
  { id: 'teams.manage', name: 'Manage Teams', description: 'Create and manage teams', category: 'System', resource: 'teams', action: 'manage' },
  { id: 'users.manage', name: 'Manage Users', description: 'Manage user accounts', category: 'System', resource: 'users', action: 'manage' },
];

// Roles data
const mockRoles: MockRole[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full system access with all permissions',
    permissions: mockPermissions.map(p => p.id), // All permissions
    color: 'bg-purple-500',
    icon: Crown,
    level: 100,
    isSystem: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Administrative access with most permissions',
    permissions: mockPermissions.filter(p => !['system.settings', 'roles.manage'].includes(p.id)).map(p => p.id),
    color: 'bg-red-500',
    icon: Shield,
    level: 90,
    isSystem: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'member',
    name: 'Member',
    description: 'Standard user with basic permissions',
    permissions: [
      'customers.read', 'customers.create', 'customers.update',
      'invoices.read', 'invoices.create', 'invoices.update',
      'transactions.read', 'transactions.create',
      'documents.read', 'documents.create', 'documents.update',
      'reports.read',
      'calendar.read', 'calendar.create', 'calendar.update',
      'time.read', 'time.create', 'time.update',
      'email.read', 'email.create',
      'queue.read',
    ],
    color: 'bg-blue-500',
    icon: Users,
    level: 50,
    isSystem: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to most features',
    permissions: [
      'customers.read',
      'invoices.read',
      'transactions.read',
      'documents.read',
      'reports.read',
      'calendar.read',
      'time.read',
      'email.read',
      'queue.read',
    ],
    color: 'bg-green-500',
    icon: Eye,
    level: 25,
    isSystem: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'guest',
    name: 'Guest',
    description: 'Limited access to basic features',
    permissions: [
      'customers.read',
      'invoices.read',
      'reports.read',
    ],
    color: 'bg-gray-500',
    icon: UserCheck,
    level: 10,
    isSystem: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Teams data
const mockTeams: MockTeam[] = [
  {
    id: 'default',
    name: 'Default Team',
    description: 'Default team for all users',
    members: [
      {
        id: 'tm1',
        userId: 'user1',
        teamId: 'default',
        role: 'owner',
        joinedAt: new Date('2024-01-01'),
        addedBy: 'system',
        status: 'active',
        user: {
          id: 'user1',
          name: 'John Doe',
          email: 'john@midday.ai',
          avatar: 'https://avatar.vercel.sh/john',
        },
      },
      {
        id: 'tm2',
        userId: 'user2',
        teamId: 'default',
        role: 'admin',
        joinedAt: new Date('2024-01-15'),
        addedBy: 'user1',
        status: 'active',
        user: {
          id: 'user2',
          name: 'Jane Smith',
          email: 'jane@midday.ai',
          avatar: 'https://avatar.vercel.sh/jane',
        },
      },
      {
        id: 'tm3',
        userId: 'user3',
        teamId: 'default',
        role: 'member',
        joinedAt: new Date('2024-02-01'),
        addedBy: 'user1',
        status: 'active',
        user: {
          id: 'user3',
          name: 'Mike Johnson',
          email: 'mike@midday.ai',
          avatar: 'https://avatar.vercel.sh/mike',
        },
      },
    ],
    owner: 'user1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-09-01'),
    isDefault: true,
    color: 'bg-blue-500',
    memberCount: 3,
  },
  {
    id: 'finance',
    name: 'Finance Team',
    description: 'Team for financial operations and reporting',
    members: [
      {
        id: 'tm4',
        userId: 'user4',
        teamId: 'finance',
        role: 'admin',
        joinedAt: new Date('2024-03-01'),
        addedBy: 'user1',
        status: 'active',
        user: {
          id: 'user4',
          name: 'Sarah Wilson',
          email: 'sarah@midday.ai',
          avatar: 'https://avatar.vercel.sh/sarah',
        },
      },
      {
        id: 'tm5',
        userId: 'user5',
        teamId: 'finance',
        role: 'member',
        joinedAt: new Date('2024-03-15'),
        addedBy: 'user4',
        status: 'active',
        user: {
          id: 'user5',
          name: 'Tom Brown',
          email: 'tom@midday.ai',
          avatar: 'https://avatar.vercel.sh/tom',
        },
      },
    ],
    owner: 'user4',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-09-01'),
    isDefault: false,
    color: 'bg-green-500',
    memberCount: 2,
  },
  {
    id: 'sales',
    name: 'Sales Team',
    description: 'Customer-facing sales and support team',
    members: [
      {
        id: 'tm6',
        userId: 'user6',
        teamId: 'sales',
        role: 'admin',
        joinedAt: new Date('2024-04-01'),
        addedBy: 'user1',
        status: 'active',
        user: {
          id: 'user6',
          name: 'Lisa Davis',
          email: 'lisa@midday.ai',
          avatar: 'https://avatar.vercel.sh/lisa',
        },
      },
    ],
    owner: 'user6',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-09-01'),
    isDefault: false,
    color: 'bg-purple-500',
    memberCount: 1,
  },
];

// Team invites data
const mockTeamInvites: MockTeamInvite[] = [
  {
    id: 'invite_1',
    teamId: 'default',
    email: 'newuser@example.com',
    role: 'member',
    inviteCode: 'TEAM_ABC123',
    invitedBy: 'user1',
    createdAt: new Date('2024-03-10'),
    expiresAt: new Date('2024-03-17'),
    status: 'pending',
    teamName: 'Default Team',
    inviterName: 'John Doe',
  },
];

function generateInviteCode(): string {
  return 'TEAM_' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// API functions
export const rolesAPI = {
  // Roles
  async getRoles(): Promise<MockRole[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockRoles;
  },

  async getRole(id: string): Promise<MockRole | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockRoles.find(role => role.id === id) || null;
  },

  async createRole(data: Partial<MockRole>): Promise<MockRole> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newRole: MockRole = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name || '',
      description: data.description || '',
      permissions: data.permissions || [],
      color: data.color || 'bg-gray-500',
      icon: data.icon || Users,
      level: data.level || 50,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockRoles.push(newRole);
    return newRole;
  },

  async updateRole(id: string, data: Partial<MockRole>): Promise<MockRole> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const roleIndex = mockRoles.findIndex(role => role.id === id);
    if (roleIndex === -1) throw new Error('Role not found');
    
    mockRoles[roleIndex] = { ...mockRoles[roleIndex], ...data, updatedAt: new Date() };
    return mockRoles[roleIndex];
  },

  async deleteRole(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const roleIndex = mockRoles.findIndex(role => role.id === id);
    if (roleIndex === -1) throw new Error('Role not found');
    
    if (mockRoles[roleIndex].isSystem) {
      throw new Error('Cannot delete system role');
    }
    
    mockRoles.splice(roleIndex, 1);
  },

  // Permissions
  async getPermissions(): Promise<MockPermission[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPermissions;
  },

  async getPermissionsByRole(roleId: string): Promise<MockPermission[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const role = mockRoles.find(r => r.id === roleId);
    if (!role) return [];
    
    return mockPermissions.filter(p => role.permissions.includes(p.id));
  },

  // Teams
  async getTeams(): Promise<MockTeam[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockTeams;
  },

  async getTeam(id: string): Promise<MockTeam | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockTeams.find(team => team.id === id) || null;
  },

  async createTeam(data: Partial<MockTeam>): Promise<MockTeam> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newTeam: MockTeam = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name || '',
      description: data.description || '',
      members: [],
      owner: data.owner || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: false,
      color: data.color || 'bg-blue-500',
      memberCount: 0,
    };
    mockTeams.push(newTeam);
    return newTeam;
  },

  async updateTeam(id: string, data: Partial<MockTeam>): Promise<MockTeam> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const teamIndex = mockTeams.findIndex(team => team.id === id);
    if (teamIndex === -1) throw new Error('Team not found');
    
    mockTeams[teamIndex] = { ...mockTeams[teamIndex], ...data, updatedAt: new Date() };
    return mockTeams[teamIndex];
  },

  async deleteTeam(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const teamIndex = mockTeams.findIndex(team => team.id === id);
    if (teamIndex === -1) throw new Error('Team not found');
    
    if (mockTeams[teamIndex].isDefault) {
      throw new Error('Cannot delete default team');
    }
    
    mockTeams.splice(teamIndex, 1);
  },

  async addTeamMember(teamId: string, data: Partial<MockTeamMember>): Promise<MockTeamMember> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const team = mockTeams.find(t => t.id === teamId);
    if (!team) throw new Error('Team not found');

    const newMember: MockTeamMember = {
      id: Math.random().toString(36).substr(2, 9),
      userId: data.userId || '',
      teamId,
      role: data.role || 'member',
      joinedAt: new Date(),
      addedBy: data.addedBy || '',
      status: 'active',
      user: data.user || {
        id: data.userId || '',
        name: 'New User',
        email: 'user@example.com',
      },
    };

    team.members.push(newMember);
    team.memberCount = team.members.length;
    return newMember;
  },

  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const team = mockTeams.find(t => t.id === teamId);
    if (!team) throw new Error('Team not found');

    const memberIndex = team.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) throw new Error('Member not found');

    team.members.splice(memberIndex, 1);
    team.memberCount = team.members.length;
  },

  async updateTeamMemberRole(teamId: string, memberId: string, role: string): Promise<MockTeamMember> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const team = mockTeams.find(t => t.id === teamId);
    if (!team) throw new Error('Team not found');

    const member = team.members.find(m => m.id === memberId);
    if (!member) throw new Error('Member not found');

    member.role = role;
    return member;
  },

  // Team invitations
  async inviteToTeam(teamId: string, email: string, role: string, invitedBy: string): Promise<MockTeamInvite> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const team = mockTeams.find(t => t.id === teamId);
    if (!team) throw new Error('Team not found');

    // Check if user is already a member
    const existingMember = team.members.find(m => m.user.email === email);
    if (existingMember) {
      throw new Error('User is already a member of this team');
    }

    // Check if there's already a pending invite
    const existingInvite = mockTeamInvites.find(
      i => i.teamId === teamId && i.email === email && i.status === 'pending'
    );
    if (existingInvite) {
      throw new Error('User already has a pending invitation');
    }

    const invite: MockTeamInvite = {
      id: `invite_${Date.now()}`,
      teamId,
      email,
      role,
      inviteCode: generateInviteCode(),
      invitedBy,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending',
      teamName: team.name,
      inviterName: 'Current User', // In real app, get from invitedBy user
    };

    mockTeamInvites.push(invite);
    console.log(`Invite sent to ${email} for team ${team.name}. Code: ${invite.inviteCode}`);
    return invite;
  },

  async getTeamInvites(teamId?: string): Promise<MockTeamInvite[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (teamId) {
      return mockTeamInvites.filter(i => i.teamId === teamId);
    }
    return mockTeamInvites;
  },

  async getInviteByCode(inviteCode: string): Promise<MockTeamInvite | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const invite = mockTeamInvites.find(i => i.inviteCode === inviteCode);
    
    // Check if expired
    if (invite && new Date() > invite.expiresAt && invite.status === 'pending') {
      invite.status = 'expired';
    }
    
    return invite || null;
  },

  async acceptInvite(inviteCode: string, userId: string): Promise<MockTeamMember> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const invite = mockTeamInvites.find(i => i.inviteCode === inviteCode);
    if (!invite) throw new Error('Invite not found');

    if (invite.status !== 'pending') {
      throw new Error('Invite is no longer valid');
    }

    if (new Date() > invite.expiresAt) {
      invite.status = 'expired';
      throw new Error('Invite has expired');
    }

    const team = mockTeams.find(t => t.id === invite.teamId);
    if (!team) throw new Error('Team not found');

    // Create new team member
    const newMember: MockTeamMember = {
      id: `tm_${Date.now()}`,
      userId,
      teamId: invite.teamId,
      role: invite.role,
      joinedAt: new Date(),
      addedBy: invite.invitedBy,
      status: 'active',
      user: {
        id: userId,
        name: 'New Member', // In real app, get from user data
        email: invite.email,
        avatar: `https://avatar.vercel.sh/${invite.email}`,
      },
    };

    team.members.push(newMember);
    team.memberCount = team.members.length;
    invite.status = 'accepted';

    return newMember;
  },

  async declineInvite(inviteCode: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const invite = mockTeamInvites.find(i => i.inviteCode === inviteCode);
    if (!invite) throw new Error('Invite not found');

    invite.status = 'declined';
  },

  async cancelInvite(inviteId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const inviteIndex = mockTeamInvites.findIndex(i => i.id === inviteId);
    if (inviteIndex === -1) throw new Error('Invite not found');

    mockTeamInvites.splice(inviteIndex, 1);
  },

  async getUserTeams(userId: string): Promise<MockTeam[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockTeams.filter(team => 
      team.members.some(member => member.userId === userId && member.status === 'active')
    );
  },

  async switchUserTeam(userId: string, teamId: string): Promise<MockTeam | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const team = mockTeams.find(t => t.id === teamId);
    if (!team) return null;

    const isMember = team.members.some(m => m.userId === userId && m.status === 'active');
    if (!isMember) {
      throw new Error('User is not a member of this team');
    }

    return team;
  },
};

// Permission checking utilities
export const permissionUtils = {
  hasPermission: (userPermissions: string[], requiredPermission: string): boolean => {
    return userPermissions.includes(requiredPermission);
  },

  hasAnyPermission: (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  },

  hasAllPermissions: (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  },

  canAccess: (userRole: string, resource: string, action: string): boolean => {
    const role = mockRoles.find(r => r.id === userRole);
    if (!role) return false;

    const permissionId = `${resource}.${action}`;
    return role.permissions.includes(permissionId);
  },

  getUserPermissions: (roleId: string): string[] => {
    const role = mockRoles.find(r => r.id === roleId);
    return role?.permissions || [];
  },

  getRoleLevel: (roleId: string): number => {
    const role = mockRoles.find(r => r.id === roleId);
    return role?.level || 0;
  },
};

export { mockPermissions, mockRoles, mockTeams };