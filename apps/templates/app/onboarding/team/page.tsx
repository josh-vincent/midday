"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useToast } from "@midday/ui/use-toast";
import { 
  ArrowRight, 
  Users, 
  Plus,
  Building,
  MapPin,
  DollarSign,
  Mail,
  UserPlus,
  Skip,
  Check
} from "lucide-react";
import { authAPI } from "@/lib/mock/auth-mock";
import { onboardingAPI } from "@/lib/mock/onboarding-mock";
import { rolesAPI, type MockTeam, type MockTeamInvite } from "@/lib/mock/roles-mock";

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(false);
  const [existingTeams, setExistingTeams] = useState<MockTeam[]>([]);
  const [pendingInvites, setPendingInvites] = useState<MockTeamInvite[]>([]);
  const [user, setUser] = useState(null);
  
  // Create team form
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    country: "",
    currency: "USD",
    inviteEmails: [""],
  });

  // Join team form  
  const [joinForm, setJoinForm] = useState({
    inviteCode: "",
  });

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        // Load user's existing teams
        const teams = await rolesAPI.getUserTeams(currentUser.id);
        setExistingTeams(teams);
        
        // Load pending invites
        const invites = await rolesAPI.getTeamInvites();
        const userInvites = invites.filter(invite => 
          invite.email === currentUser.email && invite.status === 'pending'
        );
        setPendingInvites(userInvites);
      }
    } catch (error) {
      console.error("Failed to load team data:", error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !createForm.name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Create the team
      const team = await rolesAPI.createTeam({
        name: createForm.name,
        description: createForm.description,
        owner: user.id,
        country: createForm.country,
        currency: createForm.currency,
      });

      // Send invites if any emails provided
      const validEmails = createForm.inviteEmails.filter(email => 
        email.trim() && email.includes("@")
      );

      for (const email of validEmails) {
        try {
          await rolesAPI.inviteToTeam(team.id, email, "member", user.id);
        } catch (error) {
          console.error(`Failed to invite ${email}:`, error);
        }
      }

      // Update user's current team
      await authAPI.updateUser(user.id, { currentTeamId: team.id });

      // Complete onboarding step
      await onboardingAPI.completeStep(user.id, "team");
      
      toast({
        title: "Team created!",
        description: `${team.name} has been created successfully`,
      });
      
      router.push("/onboarding/preferences");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (inviteCode: string) => {
    if (!user) return;

    setLoading(true);
    
    try {
      const member = await rolesAPI.acceptInvite(inviteCode, user.id);
      
      // Update user's current team
      await authAPI.updateUser(user.id, { currentTeamId: member.teamId });

      // Complete onboarding step
      await onboardingAPI.completeStep(user.id, "team");
      
      toast({
        title: "Joined team!",
        description: "You have successfully joined the team",
      });
      
      router.push("/onboarding/preferences");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join team",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      await onboardingAPI.skipStep(user.id, "team");
      router.push("/onboarding/preferences");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to skip step",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addInviteEmail = () => {
    setCreateForm(prev => ({
      ...prev,
      inviteEmails: [...prev.inviteEmails, ""],
    }));
  };

  const updateInviteEmail = (index: number, email: string) => {
    setCreateForm(prev => ({
      ...prev,
      inviteEmails: prev.inviteEmails.map((e, i) => i === index ? email : e),
    }));
  };

  const removeInviteEmail = (index: number) => {
    if (createForm.inviteEmails.length > 1) {
      setCreateForm(prev => ({
        ...prev,
        inviteEmails: prev.inviteEmails.filter((_, i) => i !== index),
      }));
    }
  };

  const countries = [
    { value: "US", label: "United States" },
    { value: "CA", label: "Canada" },
    { value: "GB", label: "United Kingdom" },
    { value: "DE", label: "Germany" },
    { value: "FR", label: "France" },
    { value: "AU", label: "Australia" },
    { value: "JP", label: "Japan" },
    // Add more countries as needed
  ];

  const currencies = [
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
    { value: "CAD", label: "CAD - Canadian Dollar" },
    { value: "AUD", label: "AUD - Australian Dollar" },
    { value: "JPY", label: "JPY - Japanese Yen" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create or join a team</h1>
        <p className="text-muted-foreground">
          Teams help you collaborate with others and organize your work
        </p>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <div>
                  <p className="font-medium">{invite.teamName}</p>
                  <p className="text-sm text-muted-foreground">
                    Invited by {invite.inviterName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    onClick={() => handleJoinTeam(invite.inviteCode)}
                    disabled={loading}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => rolesAPI.declineInvite(invite.inviteCode)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create New Team</TabsTrigger>
          <TabsTrigger value="join">Join Existing Team</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Team Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team name *</Label>
                    <Input
                      id="teamName"
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Acme Inc."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Country
                    </Label>
                    <Select 
                      value={createForm.country} 
                      onValueChange={(value) => setCreateForm(prev => ({ ...prev, country: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell us about your team..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Default currency
                  </Label>
                  <Select 
                    value={createForm.currency} 
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Team member invites */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Invite team members (optional)</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addInviteEmail}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add email
                    </Button>
                  </div>
                  
                  {createForm.inviteEmails.map((email, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => updateInviteEmail(index, e.target.value)}
                          placeholder="colleague@example.com"
                        />
                      </div>
                      {createForm.inviteEmails.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeInviteEmail(index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    "Creating team..."
                  ) : (
                    <>
                      Create team
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="join" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Join with Invite Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite code</Label>
                <Input
                  id="inviteCode"
                  value={joinForm.inviteCode}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, inviteCode: e.target.value }))}
                  placeholder="TEAM_XXXXXX"
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the invite code provided by your team admin
                </p>
              </div>

              <Button 
                onClick={() => handleJoinTeam(joinForm.inviteCode)}
                disabled={loading || !joinForm.inviteCode.trim()}
                className="w-full"
              >
                {loading ? (
                  "Joining team..."
                ) : (
                  <>
                    Join team
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Demo invite code */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm font-medium mb-2">Demo Invite Code:</p>
              <p className="font-mono text-sm">TEAM_ABC123</p>
              <p className="text-xs text-muted-foreground mt-2">
                Use this code to join the demo team
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleSkip} disabled={loading}>
          <Skip className="mr-2 h-4 w-4" />
          Skip for now
        </Button>
      </div>
    </div>
  );
}